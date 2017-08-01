module.exports = v => new LazyPromise(v);

const gene = function* (iter) {
	for (const v of iter) yield v;
};
const isPromise = (obj) => 'function' === typeof obj.then;

const LazyPromise = class {
	constructor(iter) {
		this.seed = gene(iter);
		this.values = [];
	}
	[Symbol.iterator]() {
		return this.seed;
	}
	series() {
		return this._handleResult(this.seed.next());
	}
	all() {
		return Promise.all(this);
	}
	_handleResult({value, done}) {
		let promise, currentPosition;
		if (done === false) {
			if (!isPromise(value)) {
				currentPosition = this.values.length - 1;
				promise = value(this.values[currentPosition], currentPosition, this.values);
			} else {
				promise = value;
			}

			return promise
				.then(
					value => {
						if (value) this.values.push(value);
						return this._handleResult(this.seed.next());
					},
					error => {
						this.seed.throw(error);
						return error;
					}
				);
		} else {
			return Promise.resolve(this.values);
		}
	}
};