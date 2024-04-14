const childProcess = require('child_process');
const EventEmitter = require('events');
const util = require('util');
const JSONStream = require('./json-stream.js');

const supportedOutputFormats = ['json', 'json-pretty', 'short', 'short-iso', 'short-monotonic', 'verbose', 'export', 'json-sse'];

function Journalctl (opts) {
	EventEmitter.call(this);

	// Decode opts
	const args = ['-f', '-o', 'json'];
	if (opts === undefined) opts = {};
	if (opts.all) args.push('-a');
	if (opts.lines) args.push('-n', opts.lines);
	if (opts.since) args.push('-S', opts.since);
	if (opts.until) args.push('-U', opts.until);
	if (opts.reverse) args.push('-r');
	if (opts.utc) args.push('--utc');
	if (opts.identifier) args.push('-t', opts.identifier);
	if (opts.unit) args.push('-u', opts.unit);
	if (opts.output && supportedOutputFormats.includes(opts.output)) args.push('-o', opts.output);
	if (opts.filter) {
		if (!(opts.filter instanceof Array)) opts.filter = [opts.filter];
		opts.filter.forEach((f) => args.push(f));
	}

	// Start journalctl
	this.journalctl = childProcess.spawn('journalctl', args);

	// Setup decoder
	const decoder = new JSONStream((e) => {
		this.emit('event', e);
	});
	this.journalctl.stdout.on('data', (chunk) => {
		decoder.decode(chunk.toString());
	});
}

util.inherits(Journalctl, EventEmitter);

Journalctl.prototype.stop = function (cb) {
	// Kill the process
	if (cb) this.journalctl.on('exit', cb);
	this.journalctl.kill();
};

module.exports = Journalctl;
