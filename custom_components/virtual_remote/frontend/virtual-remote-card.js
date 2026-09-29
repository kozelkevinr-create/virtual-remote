//#region node_modules/@lit/reactive-element/css-tag.js
var e = globalThis, t = e.ShadowRoot && (e.ShadyCSS === void 0 || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, n = Symbol(), r = /* @__PURE__ */ new WeakMap(), i = class {
	constructor(e, t, r) {
		if (this._$cssResult$ = !0, r !== n) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, n = this.t;
		if (t && e === void 0) {
			let t = n !== void 0 && n.length === 1;
			t && (e = r.get(n)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && r.set(n, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, a = (e) => new i(typeof e == "string" ? e : e + "", void 0, n), o = (e, ...t) => new i(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, n), s = (n, r) => {
	if (t) n.adoptedStyleSheets = r.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let t of r) {
		let r = document.createElement("style"), i = e.litNonce;
		i !== void 0 && r.setAttribute("nonce", i), r.textContent = t.cssText, n.appendChild(r);
	}
}, c = t ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return a(t);
})(e) : e, { is: l, defineProperty: u, getOwnPropertyDescriptor: d, getOwnPropertyNames: f, getOwnPropertySymbols: p, getPrototypeOf: m } = Object, h = globalThis, ee = h.trustedTypes, te = ee ? ee.emptyScript : "", ne = h.reactiveElementPolyfillSupport, g = (e, t) => e, _ = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? te : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, re = (e, t) => !l(e, t), ie = {
	attribute: !0,
	type: String,
	converter: _,
	reflect: !1,
	useDefault: !1,
	hasChanged: re
};
Symbol.metadata ??= Symbol("metadata"), h.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = ie) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && u(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = d(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? ie;
	}
	static _$Ei() {
		if (this.hasOwnProperty(g("elementProperties"))) return;
		let e = m(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(g("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(g("properties"))) {
			let e = this.properties, t = [...f(e), ...p(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(c(e));
		} else e !== void 0 && t.push(c(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return s(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? _ : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? _ : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? re)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[g("elementProperties")] = /* @__PURE__ */ new Map(), v[g("finalized")] = /* @__PURE__ */ new Map(), ne?.({ ReactiveElement: v }), (h.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var ae = globalThis, oe = (e) => e, y = ae.trustedTypes, se = y ? y.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, b = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, S = "?" + x, ce = `<${S}>`, C = document, w = () => C.createComment(""), T = (e) => e === null || typeof e != "object" && typeof e != "function", E = Array.isArray, le = (e) => E(e) || typeof e?.[Symbol.iterator] == "function", ue = "[ 	\n\f\r]", D = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, de = /-->/g, fe = />/g, O = RegExp(`>|${ue}(?:([^\\s"'>=/]+)(${ue}*=${ue}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), pe = /'/g, me = /"/g, he = /^(?:script|style|textarea|title)$/i, k = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), A = Symbol.for("lit-noChange"), j = Symbol.for("lit-nothing"), ge = /* @__PURE__ */ new WeakMap(), M = C.createTreeWalker(C, 129);
function _e(e, t) {
	if (!E(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return se === void 0 ? t : se.createHTML(t);
}
var ve = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = D;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === D ? c[1] === "!--" ? o = de : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = O) : (he.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = O) : o = fe : o === O ? c[0] === ">" ? (o = i ?? D, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? O : c[3] === "\"" ? me : pe) : o === me || o === pe ? o = O : o === de || o === fe ? o = D : (o = O, i = void 0);
		let d = o === O && e[t + 1].startsWith("/>") ? " " : "";
		a += o === D ? n + ce : l >= 0 ? (r.push(s), n.slice(0, l) + b + n.slice(l) + x + d) : n + x + (l === -2 ? t : d);
	}
	return [_e(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, N = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ve(t, n);
		if (this.el = e.createElement(l, r), M.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = M.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(b)) {
					let t = u[o++], n = i.getAttribute(e).split(x), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? be : r[1] === "?" ? xe : r[1] === "@" ? Se : I
					}), i.removeAttribute(e);
				} else e.startsWith(x) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (he.test(i.tagName)) {
					let e = i.textContent.split(x), t = e.length - 1;
					if (t > 0) {
						i.textContent = y ? y.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], w()), M.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], w());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === S) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(x, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += x.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = C.createElement("template");
		return n.innerHTML = e, n;
	}
};
function P(e, t, n = e, r) {
	if (t === A) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = T(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = P(e, i._$AS(e, t.values), i, r)), t;
}
var ye = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? C).importNode(t, !0);
		M.currentNode = r;
		let i = M.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new F(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new Ce(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = M.nextNode(), a++);
		}
		return M.currentNode = C, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, F = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = j, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = P(this, e, t), T(e) ? e === j || e == null || e === "" ? (this._$AH !== j && this._$AR(), this._$AH = j) : e !== this._$AH && e !== A && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? le(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== j && T(this._$AH) ? this._$AA.nextSibling.data = e : this.T(C.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = N.createElement(_e(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new ye(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = ge.get(e.strings);
		return t === void 0 && ge.set(e.strings, t = new N(e)), t;
	}
	k(t) {
		E(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(w()), this.O(w()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = oe(e).nextSibling;
			oe(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, I = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = j, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = j;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = P(this, e, t, 0), a = !T(e) || e !== this._$AH && e !== A, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = P(this, r[n + o], t, o), s === A && (s = this._$AH[o]), a ||= !T(s) || s !== this._$AH[o], s === j ? e = j : e !== j && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === j ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, be = class extends I {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === j ? void 0 : e;
	}
}, xe = class extends I {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== j);
	}
}, Se = class extends I {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = P(this, e, t, 0) ?? j) === A) return;
		let n = this._$AH, r = e === j && n !== j || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== j && (n === j || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, Ce = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		P(this, e);
	}
}, we = {
	M: b,
	P: x,
	A: S,
	C: 1,
	L: ve,
	R: ye,
	D: le,
	V: P,
	I: F,
	H: I,
	N: xe,
	U: Se,
	B: be,
	F: Ce
}, Te = ae.litHtmlPolyfillSupport;
Te?.(N, F), (ae.litHtmlVersions ??= []).push("3.3.3");
var Ee = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new F(t.insertBefore(w(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, L = globalThis, R = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ee(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return A;
	}
};
R._$litElement$ = !0, R.finalized = !0, L.litElementHydrateSupport?.({ LitElement: R });
var De = L.litElementPolyfillSupport;
De?.({ LitElement: R }), (L.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/ha.ts
function z(e, t, n) {
	e.dispatchEvent(new CustomEvent(t, {
		detail: n,
		bubbles: !0,
		composed: !0
	}));
}
function B(e) {
	e && e !== "none" && z(window, "haptic", e);
}
function Oe(e) {
	history.pushState(null, "", e), z(window, "location-changed", { replace: !1 });
}
function V(e, t) {
	z(e, "hass-notification", { message: t });
}
function H(e) {
	return e && typeof e == "object" && "message" in e ? String(e.message) : String(e);
}
async function ke() {
	if (customElements.get("ha-form") && customElements.get("ha-selector")) return;
	let e = await window.loadCardHelpers?.();
	e && (await (await e.createCardElement({
		type: "entities",
		entities: []
	}))?.constructor?.getConfigElement?.(), await customElements.whenDefined("ha-form"));
}
//#endregion
//#region src/actions.ts
var Ae = /* @__PURE__ */ new Set(["perform-action", "none"]);
function je(e, t) {
	let n = e.hold_action ?? { action: "none" };
	return t && n.action !== "none" ? n : e.tap_action ?? { action: "none" };
}
function Me(e) {
	return (e.hold_action?.action ?? "none") !== "none";
}
async function Ne(e, t, n = !1) {
	let r = je(t, n);
	if (r.action === "none") return;
	if (!Ae.has(r.action)) {
		Pe(e.node, r);
		return;
	}
	if (e.entityId) {
		await e.hass.callService("remote", "send_command", {
			command: t.id,
			...n ? { hold_secs: .5 } : {}
		}, { entity_id: e.entityId });
		return;
	}
	let [i, a] = (r.perform_action ?? "").split(".", 2);
	if (!i || !a) throw Error(`Button ${t.id} has no action to perform`);
	await e.hass.callService(i, a, r.data, r.target);
}
function Pe(e, t) {
	switch (t.action) {
		case "navigate":
			t.navigation_path && Oe(t.navigation_path);
			break;
		case "url":
			t.url_path && window.open(t.url_path, "_blank", "noopener");
			break;
		case "more-info": t.entity && z(e, "hass-more-info", { entityId: t.entity });
	}
}
function Fe(e, t) {
	for (let [n, r] of Object.entries(e.states)) if (n.startsWith("remote.") && r.attributes.remote_id === t) return n;
}
//#endregion
//#region src/button.ts
var Ie, Le = 10, U = class extends R {
	constructor() {
		super(), this._start = {
			x: 0,
			y: 0
		}, this._fired = !1, this._onTouchMove = (e) => {
			this._fired && this._pointerId !== void 0 && e.cancelable && e.preventDefault();
		}, this.interactive = !0, this.selected = !1, this._pressed = !1, this._error = !1;
	}
	flashError() {
		this._error = !0, B("heavy"), window.setTimeout(() => this._error = !1, 600);
	}
	connectedCallback() {
		super.connectedCallback(), this.addEventListener("touchmove", this._onTouchMove, { passive: !1 });
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeEventListener("touchmove", this._onTouchMove), this._reset();
	}
	_emit(e, t) {
		let n = {
			button: this.button,
			hold: e,
			repeat: t
		};
		this.dispatchEvent(new CustomEvent("vr-press", {
			detail: n,
			bubbles: !0,
			composed: !0
		}));
	}
	_onPointerDown(e) {
		if (!this.interactive || e.button !== 0 || this._pointerId !== void 0) return;
		this._pointerId = e.pointerId, e.currentTarget.setPointerCapture?.(e.pointerId), this._start = {
			x: e.clientX,
			y: e.clientY
		}, this._fired = !1, this._pressed = !0, B(this.button.haptic ?? "light");
		let t = this.button.repeat;
		t?.enabled ? this._timer = window.setTimeout(() => {
			this._fired = !0, this._emit(!1, !1), this._timer = window.setTimeout(() => this._repeatTick(t.interval_ms), t.interval_ms);
		}, t.delay_ms) : Me(this.button) && (this._timer = window.setTimeout(() => {
			this._fired = !0, B("medium"), this._emit(!0, !1);
		}, 500));
	}
	_repeatTick(e) {
		this._emit(!1, !0), this._timer = window.setTimeout(() => this._repeatTick(e), e);
	}
	_onPointerMove(e) {
		if (e.pointerId !== this._pointerId || this._fired) return;
		let t = e.clientX - this._start.x, n = e.clientY - this._start.y;
		Math.hypot(t, n) > Le && this._reset();
	}
	_onPointerUp(e) {
		if (e.pointerId !== this._pointerId) return;
		let t = this._fired;
		this._reset(), t || this._emit(!1, !1);
	}
	_reset() {
		window.clearTimeout(this._timer), this._timer = void 0, this._pointerId = void 0, this._pressed = !1;
	}
	_onKeyDown(e) {
		!this.interactive || e.key !== "Enter" && e.key !== " " || (e.preventDefault(), this._emit(!1, !1));
	}
	render() {
		let e = this.button, t = [e.color?.bg ? `--vr-bg:${e.color.bg}` : "", e.color?.fg ? `--vr-fg:${e.color.fg}` : ""].join(";");
		return k`
      <div
        class=${[
			"btn",
			e.shape ?? "rect",
			this._pressed ? "pressed" : "",
			this._error ? "error" : ""
		].join(" ")}
        style=${t}
        role=${this.interactive ? "button" : j}
        tabindex=${this.interactive ? "0" : j}
        aria-label=${e.label || e.id}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @pointercancel=${this._reset}
        @lostpointercapture=${this._reset}
        @keydown=${this._onKeyDown}
        @contextmenu=${(e) => e.preventDefault()}
      >
        ${e.icon ? k`<ha-icon .icon=${e.icon}></ha-icon>` : j}
        ${e.label ? k`<span class="label">${e.label}</span>` : j}
        ${!e.icon && !e.label ? k`<span class="label id">${e.id}</span>` : j}
      </div>
    `;
	}
};
Ie = U, Ie.properties = {
	button: { attribute: !1 },
	interactive: { type: Boolean },
	selected: {
		type: Boolean,
		reflect: !0
	},
	_pressed: { state: !0 },
	_error: { state: !0 }
}, Ie.styles = o`
    :host {
      display: block;
      min-width: 0;
      min-height: 0;
    }
    .btn {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      overflow: hidden;
      background: var(--vr-bg, var(--secondary-background-color, #e5e5e5));
      color: var(--vr-fg, var(--primary-text-color, #212121));
      border-radius: var(--vr-radius, 12px);
      cursor: pointer;
      /* Mobile: no 300 ms tap delay, no double-tap zoom, no text selection,
         no iOS callout or grey flash on long-press. */
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform 80ms ease-out, filter 80ms ease-out, box-shadow 120ms;
      outline: none;
    }
    .btn:focus-visible {
      box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
    }
    .circle {
      border-radius: 50%;
    }
    .pill {
      border-radius: 999px;
    }
    /* Optimistic feedback: reacts on pointerdown, not after the round-trip. */
    .pressed {
      transform: scale(0.93);
      filter: brightness(0.85);
    }
    .error {
      animation: shake 300ms;
      box-shadow: 0 0 0 2px var(--error-color, #db4437);
    }
    @keyframes shake {
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    :host([selected]) .btn {
      box-shadow: 0 0 0 3px var(--primary-color, #03a9f4);
    }
    ha-icon {
      --mdc-icon-size: var(--vr-icon-size, 24px);
      pointer-events: none;
    }
    .label {
      font-size: var(--vr-label-size, 12px);
      line-height: 1.1;
      text-align: center;
      padding: 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      pointer-events: none;
    }
    .id {
      opacity: 0.6;
    }
  `, customElements.get("vr-button") || customElements.define("vr-button", U);
//#endregion
//#region src/geometry.ts
function Re(e) {
	return e.reduce((e, t) => Math.max(e, t.position.y + (t.position.h ?? 1)), 0);
}
function ze(e, t) {
	return e.x < t.x + t.w && t.x < e.x + e.w && e.y < t.y + t.h && t.y < e.y + e.h;
}
function Be(e, t) {
	return e.x >= 0 && e.y >= 0 && e.w >= 1 && e.h >= 1 && e.x + e.w <= t;
}
function W(e) {
	return {
		x: e.x,
		y: e.y,
		w: e.w ?? 1,
		h: e.h ?? 1
	};
}
function G(e) {
	return (e.width - e.gap * (e.columns - 1)) / e.columns;
}
function Ve(e, t, n, r) {
	let i = G(e), a = i + e.gap, o = t - e.left, s = n - e.top, c = i / 2, l = r * a - e.gap;
	return o < -c || o > e.width + c || s < -c || s > l + a + c ? null : {
		x: Math.min(e.columns - 1, Math.max(0, Math.floor(o / a))),
		y: Math.max(0, Math.floor(s / a))
	};
}
function K(e, t, n) {
	return e.map((e) => e.id === t ? {
		...e,
		position: n
	} : e);
}
function He(e, t, n) {
	return e.filter((e) => !t.includes(e.id) && ze(W(e.position), n));
}
function Ue(e, t, n, r) {
	let i = e.find((e) => e.id === t);
	if (!i) return { ok: !1 };
	let a = W(i.position), o = {
		...a,
		x: n.x,
		y: n.y
	};
	if (o.x === a.x && o.y === a.y) return {
		ok: !0,
		buttons: e
	};
	if (!Be(o, r)) return { ok: !1 };
	let s = He(e, [t], o);
	if (s.length === 0) return {
		ok: !0,
		buttons: K(e, t, o)
	};
	if (s.length === 1) {
		let n = s[0], r = W(n.position);
		if (r.x === o.x && r.y === o.y && r.w === a.w && r.h === a.h) return {
			ok: !0,
			buttons: K(K(e, t, o), n.id, {
				...r,
				x: a.x,
				y: a.y
			}),
			swappedWith: n.id
		};
	}
	return { ok: !1 };
}
function We(e, t, n, r) {
	let i = e.find((e) => e.id === t);
	if (!i) return { ok: !1 };
	let a = {
		...W(i.position),
		w: n.w,
		h: n.h
	};
	return !Be(a, r) || He(e, [t], a).length ? { ok: !1 } : {
		ok: !0,
		buttons: K(e, t, a)
	};
}
function q(e, t, n, r) {
	let i = Math.min(t, r);
	for (let t = 0;; t++) for (let a = 0; a + i <= r; a++) if (He(e, [], {
		x: a,
		y: t,
		w: i,
		h: n
	}).length === 0) return {
		x: a,
		y: t
	};
}
function Ge(e, t) {
	let n = [], r = [];
	for (let i of e) (Be(W(i.position), t) ? n : r).push(i);
	for (let e of r) {
		let r = Math.min(e.position.w ?? 1, t), i = e.position.h ?? 1, a = q(n, r, i, t);
		n.push({
			...e,
			position: {
				...a,
				w: r,
				h: i
			}
		});
	}
	return e.map((e) => n.find((t) => t.id === e.id));
}
function Ke(e, t) {
	let n = new Set(e.map((e) => e.id)), r = t.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "button";
	if (!n.has(r)) return r;
	for (let e = 2;; e++) if (!n.has(`${r}_${e}`)) return `${r}_${e}`;
}
//#endregion
//#region node_modules/lit-html/directive.js
var qe = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
}, Je = (e) => (...t) => ({
	_$litDirective$: e,
	values: t
}), Ye = class {
	constructor(e) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(e, t, n) {
		this._$Ct = e, this._$AM = t, this._$Ci = n;
	}
	_$AS(e, t) {
		return this.update(e, t);
	}
	update(e, t) {
		return this.render(...t);
	}
}, { I: Xe } = we, Ze = (e) => e, Qe = () => document.createComment(""), J = (e, t, n) => {
	let r = e._$AA.parentNode, i = t === void 0 ? e._$AB : t._$AA;
	if (n === void 0) n = new Xe(r.insertBefore(Qe(), i), r.insertBefore(Qe(), i), e, e.options);
	else {
		let t = n._$AB.nextSibling, a = n._$AM, o = a !== e;
		if (o) {
			let t;
			n._$AQ?.(e), n._$AM = e, n._$AP !== void 0 && (t = e._$AU) !== a._$AU && n._$AP(t);
		}
		if (t !== i || o) {
			let e = n._$AA;
			for (; e !== t;) {
				let t = Ze(e).nextSibling;
				Ze(r).insertBefore(e, i), e = t;
			}
		}
	}
	return n;
}, Y = (e, t, n = e) => (e._$AI(t, n), e), $e = {}, et = (e, t = $e) => e._$AH = t, tt = (e) => e._$AH, nt = (e) => {
	e._$AR(), e._$AA.remove();
}, rt = (e, t, n) => {
	let r = /* @__PURE__ */ new Map();
	for (let i = t; i <= n; i++) r.set(e[i], i);
	return r;
}, it = Je(class extends Ye {
	constructor(e) {
		if (super(e), e.type !== qe.CHILD) throw Error("repeat() can only be used in text expressions");
	}
	dt(e, t, n) {
		let r;
		n === void 0 ? n = t : t !== void 0 && (r = t);
		let i = [], a = [], o = 0;
		for (let t of e) i[o] = r ? r(t, o) : o, a[o] = n(t, o), o++;
		return {
			values: a,
			keys: i
		};
	}
	render(e, t, n) {
		return this.dt(e, t, n).values;
	}
	update(e, [t, n, r]) {
		let i = tt(e), { values: a, keys: o } = this.dt(t, n, r);
		if (!Array.isArray(i)) return this.ut = o, a;
		let s = this.ut ??= [], c = [], l, u, d = 0, f = i.length - 1, p = 0, m = a.length - 1;
		for (; d <= f && p <= m;) if (i[d] === null) d++;
		else if (i[f] === null) f--;
		else if (s[d] === o[p]) c[p] = Y(i[d], a[p]), d++, p++;
		else if (s[f] === o[m]) c[m] = Y(i[f], a[m]), f--, m--;
		else if (s[d] === o[m]) c[m] = Y(i[d], a[m]), J(e, c[m + 1], i[d]), d++, m--;
		else if (s[f] === o[p]) c[p] = Y(i[f], a[p]), J(e, i[d], i[f]), f--, p++;
		else if (l === void 0 && (l = rt(o, p, m), u = rt(s, d, f)), l.has(s[d])) {
			if (l.has(s[f])) {
				let t = u.get(o[p]), n = t === void 0 ? null : i[t];
				if (n === null) {
					let t = J(e, i[d]);
					Y(t, a[p]), c[p] = t;
				} else c[p] = Y(n, a[p]), J(e, i[d], n), i[t] = null;
				p++;
			} else nt(i[f]), f--;
		} else nt(i[d]), d++;
		for (; p <= m;) {
			let t = J(e, c[m + 1]);
			Y(t, a[p]), c[p++] = t;
		}
		for (; d <= f;) {
			let e = i[d++];
			e !== null && nt(e);
		}
		return this.ut = o, et(e, c), A;
	}
}), at, ot = class extends R {
	constructor() {
		super(), this.interactive = !0, this.fit = !1, this.extraRows = 0, this._cell = 48;
	}
	connectedCallback() {
		super.connectedCallback(), this._observer = new ResizeObserver(() => this._measure()), this._observer.observe(this);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._observer?.disconnect();
	}
	updated(e) {
		(e.has("remote") || e.has("extraRows")) && this._measure();
	}
	get rows() {
		return Math.max(1, Re(this.remote?.buttons ?? []) + this.extraRows);
	}
	get surface() {
		return this.renderRoot.querySelector(".grid");
	}
	_measure() {
		if (!this.remote) return;
		let { columns: e, gap: t } = this.remote.grid, n = this.clientWidth;
		if (!n) return;
		let r = (n - t * (e - 1)) / e;
		if (this.fit && this.clientHeight) {
			let e = this.rows;
			r = Math.min(r, (this.clientHeight - t * (e - 1)) / e);
		}
		this._cell = Math.max(48, Math.floor(r));
	}
	render() {
		if (!this.remote) return k``;
		let { columns: e, gap: t } = this.remote.grid, n = this._cell;
		return k`
      <div class="grid" style=${`
      grid-template-columns: repeat(${e}, ${this.fit ? `${n}px` : "minmax(0, 1fr)"});
      grid-auto-rows: ${n}px;
      grid-template-rows: repeat(${this.rows}, ${n}px);
      gap: ${t}px;
      --vr-icon-size: ${Math.round(Math.min(40, Math.max(20, n * .4)))}px;
      --vr-label-size: ${n < 64 ? 11 : 13}px;
    `}>
        ${it(this.remote.buttons, (e) => e.id, (e) => k`
            <vr-button
              data-id=${e.id}
              .button=${e}
              .interactive=${this.interactive}
              ?selected=${e.id === this.selectedId}
              style="grid-column: ${e.position.x + 1} / span ${e.position.w ?? 1};
                     grid-row: ${e.position.y + 1} / span ${e.position.h ?? 1};"
            ></vr-button>
          `)}
      </div>
    `;
	}
};
at = ot, at.properties = {
	remote: { attribute: !1 },
	interactive: { type: Boolean },
	fit: {
		type: Boolean,
		reflect: !0
	},
	selectedId: { attribute: !1 },
	extraRows: { type: Number },
	_cell: { state: !0 }
}, at.styles = o`
    :host {
      display: block;
    }
    :host([fit]) {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .grid {
      display: grid;
      position: relative;
    }
  `, customElements.get("vr-grid") || customElements.define("vr-grid", ot);
//#endregion
//#region src/types.ts
var st = {
	columns: 4,
	gap: 8
}, ct = { action: "none" }, X = {
	enabled: !1,
	delay_ms: 400,
	interval_ms: 150
};
function lt(e) {
	return {
		label: "",
		shape: "rect",
		haptic: "light",
		...e,
		position: {
			w: 1,
			h: 1,
			...e.position
		},
		tap_action: ut(e.tap_action ?? ct),
		hold_action: ut(e.hold_action ?? ct),
		repeat: {
			...X,
			...e.repeat
		}
	};
}
function ut(e) {
	if (e.action !== "call-service") return e;
	let { service: t, service_data: n, ...r } = e;
	return {
		...r,
		action: "perform-action",
		perform_action: r.perform_action ?? t,
		data: r.data ?? n
	};
}
function dt(e) {
	return {
		name: e.name ?? "",
		icon: e.icon,
		grid: {
			...st,
			...e.grid
		},
		buttons: (e.buttons ?? []).map(lt)
	};
}
function Z(e) {
	return e.profiles?.length ? e.profiles.map((e) => e.remote_id) : e.remote_id ? [e.remote_id] : [];
}
//#endregion
//#region src/presets.ts
var Q = (e, t, n) => ({
	id: `digit_${e}`,
	label: String(e),
	x: t,
	y: n
}), ft = [
	{
		key: "power",
		name: "Power",
		icon: "mdi:power",
		buttons: [{
			id: "power",
			icon: "mdi:power",
			x: 0,
			y: 0,
			shape: "circle",
			service: "toggle"
		}]
	},
	{
		key: "volume",
		name: "Volume",
		icon: "mdi:volume-high",
		buttons: [
			{
				id: "vol_up",
				icon: "mdi:volume-plus",
				x: 0,
				y: 0,
				service: "volume_up",
				repeat: !0
			},
			{
				id: "mute",
				icon: "mdi:volume-mute",
				x: 0,
				y: 1,
				service: "volume_mute",
				data: { is_volume_muted: !0 }
			},
			{
				id: "vol_down",
				icon: "mdi:volume-minus",
				x: 0,
				y: 2,
				service: "volume_down",
				repeat: !0
			}
		]
	},
	{
		key: "channel",
		name: "Channel",
		icon: "mdi:television-classic",
		buttons: [{
			id: "ch_up",
			icon: "mdi:chevron-up",
			label: "CH",
			x: 0,
			y: 0,
			repeat: !0
		}, {
			id: "ch_down",
			icon: "mdi:chevron-down",
			label: "CH",
			x: 0,
			y: 1,
			repeat: !0
		}]
	},
	{
		key: "dpad",
		name: "D-pad",
		icon: "mdi:gamepad",
		buttons: [
			{
				id: "up",
				icon: "mdi:chevron-up",
				x: 1,
				y: 0,
				shape: "circle",
				repeat: !0
			},
			{
				id: "left",
				icon: "mdi:chevron-left",
				x: 0,
				y: 1,
				shape: "circle",
				repeat: !0
			},
			{
				id: "ok",
				label: "OK",
				x: 1,
				y: 1,
				shape: "circle"
			},
			{
				id: "right",
				icon: "mdi:chevron-right",
				x: 2,
				y: 1,
				shape: "circle",
				repeat: !0
			},
			{
				id: "down",
				icon: "mdi:chevron-down",
				x: 1,
				y: 2,
				shape: "circle",
				repeat: !0
			}
		]
	},
	{
		key: "navigation",
		name: "Back / Home / Menu",
		icon: "mdi:home",
		buttons: [
			{
				id: "back",
				icon: "mdi:arrow-left",
				x: 0,
				y: 0
			},
			{
				id: "home",
				icon: "mdi:home",
				x: 1,
				y: 0
			},
			{
				id: "menu",
				icon: "mdi:menu",
				x: 2,
				y: 0
			}
		]
	},
	{
		key: "transport",
		name: "Playback",
		icon: "mdi:play-pause",
		buttons: [
			{
				id: "previous",
				icon: "mdi:skip-previous",
				x: 0,
				y: 0,
				service: "media_previous_track"
			},
			{
				id: "play_pause",
				icon: "mdi:play-pause",
				x: 1,
				y: 0,
				service: "media_play_pause"
			},
			{
				id: "stop",
				icon: "mdi:stop",
				x: 2,
				y: 0,
				service: "media_stop"
			},
			{
				id: "next",
				icon: "mdi:skip-next",
				x: 3,
				y: 0,
				service: "media_next_track"
			}
		]
	},
	{
		key: "numpad",
		name: "Number pad",
		icon: "mdi:dialpad",
		buttons: [
			Q(1, 0, 0),
			Q(2, 1, 0),
			Q(3, 2, 0),
			Q(4, 0, 1),
			Q(5, 1, 1),
			Q(6, 2, 1),
			Q(7, 0, 2),
			Q(8, 1, 2),
			Q(9, 2, 2),
			Q(0, 1, 3)
		]
	},
	{
		key: "custom",
		name: "Custom button",
		icon: "mdi:gesture-tap-button",
		buttons: [{
			id: "button",
			icon: "mdi:gesture-tap-button",
			x: 0,
			y: 0
		}]
	}
];
function pt(e) {
	return {
		w: Math.max(...e.buttons.map((e) => e.x)) + 1,
		h: Math.max(...e.buttons.map((e) => e.y)) + 1
	};
}
function mt(e, t) {
	return !e.service || !t ? { action: "none" } : {
		action: "perform-action",
		perform_action: `media_player.${e.service}`,
		target: { entity_id: t },
		...e.data ? { data: e.data } : {}
	};
}
function ht(e, t, n, r, i) {
	let a = Math.max(...t.buttons.map((e) => e.x)) + 1, o = Math.max(...t.buttons.map((e) => e.y)) + 1, s = a <= n, c;
	if (i) {
		if (i.x + a > n) return null;
		for (let n of t.buttons) {
			let t = W({
				x: i.x + n.x,
				y: i.y + n.y
			});
			if (e.some((e) => ze(t, W(e.position)))) return null;
		}
		c = i;
	} else c = s ? q(e, a, o, n) : {
		x: 0,
		y: 0
	};
	let l = [];
	for (let a of t.buttons) {
		let t = [...e, ...l], o = i || s ? {
			x: c.x + a.x,
			y: c.y + a.y,
			w: 1,
			h: 1
		} : {
			...q(t, 1, 1, n),
			w: 1,
			h: 1
		};
		l.push({
			id: Ke(t, a.id),
			label: a.label ?? "",
			...a.icon ? { icon: a.icon } : {},
			shape: a.shape ?? "rect",
			position: o,
			tap_action: mt(a, r),
			hold_action: { action: "none" },
			repeat: {
				...X,
				enabled: !!a.repeat
			},
			haptic: "light"
		});
	}
	return l;
}
//#endregion
//#region src/profiles.ts
function gt(e) {
	return e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function _t(e, t) {
	let n = gt(e);
	return n !== "" && (n === t.remoteId || n === gt(t.name));
}
function vt(e, t) {
	return t ? e.findIndex((e) => _t(t, e)) : -1;
}
function yt(e, t) {
	return e.find((e) => _t(e, t));
}
//#endregion
//#region src/editor/button-sheet.ts
var bt, xt = [
	"perform-action",
	"navigate",
	"url",
	"more-info",
	"none"
], St = {
	label: "Label",
	icon: "Icon",
	shape: "Shape",
	haptic: "Vibration",
	tap_action: "Tap action",
	hold_action: "Hold action",
	repeat_enabled: "Repeat while held",
	delay_ms: "Repeat after (ms)",
	interval_ms: "Repeat every (ms)",
	bg: "Background",
	fg: "Icon and text colour",
	w: "Width (cells)",
	h: "Height (cells)",
	id: "Command ID"
}, Ct = {
	id: "What automations send with remote.send_command. Changing it breaks automations that use the old ID.",
	hold_action: "Runs after holding for half a second. Ignored while \"Repeat while held\" is on."
};
function wt(e) {
	if (e && e !== "default" && e !== "none" && e !== "state") return e.startsWith("#") || e.startsWith("var(") || e.startsWith("rgb") ? e : `var(--${e}-color)`;
}
function Tt(e) {
	let t = e?.match(/^var\(--([a-z-]+)-color\)$/);
	return t ? t[1] : e;
}
var Et = class extends R {
	_schema(e) {
		return [
			{
				type: "grid",
				name: "",
				schema: [{
					name: "label",
					selector: { text: {} }
				}, {
					name: "icon",
					selector: { icon: {} }
				}]
			},
			{
				name: "tap_action",
				selector: { ui_action: { actions: xt } }
			},
			{
				name: "repeat_enabled",
				selector: { boolean: {} }
			},
			...e ? [{
				type: "grid",
				name: "",
				schema: [{
					name: "delay_ms",
					selector: { number: {
						min: 50,
						max: 2e3,
						step: 50,
						mode: "box"
					} }
				}, {
					name: "interval_ms",
					selector: { number: {
						min: 50,
						max: 2e3,
						step: 50,
						mode: "box"
					} }
				}]
			}] : [],
			{
				name: "hold_action",
				selector: { ui_action: { actions: xt } }
			},
			{
				type: "grid",
				name: "",
				schema: [
					{
						name: "shape",
						selector: { select: {
							mode: "dropdown",
							options: [
								{
									value: "rect",
									label: "Rounded square"
								},
								{
									value: "circle",
									label: "Circle"
								},
								{
									value: "pill",
									label: "Pill"
								}
							]
						} }
					},
					{
						name: "haptic",
						selector: { select: {
							mode: "dropdown",
							options: [
								"none",
								"light",
								"medium",
								"heavy",
								"selection"
							].map((e) => ({
								value: e,
								label: e[0].toUpperCase() + e.slice(1)
							}))
						} }
					},
					{
						name: "bg",
						selector: { ui_color: {
							include_none: !1,
							include_state: !1
						} }
					},
					{
						name: "fg",
						selector: { ui_color: {
							include_none: !1,
							include_state: !1
						} }
					},
					{
						name: "w",
						selector: { number: {
							min: 1,
							max: this.columns,
							mode: "box"
						} }
					},
					{
						name: "h",
						selector: { number: {
							min: 1,
							max: 6,
							mode: "box"
						} }
					}
				]
			},
			{
				name: "id",
				selector: { text: {} }
			}
		];
	}
	_data() {
		let e = this.button, t = {
			...X,
			...e.repeat
		};
		return {
			label: e.label ?? "",
			icon: e.icon ?? "",
			tap_action: e.tap_action ?? { action: "none" },
			hold_action: e.hold_action ?? { action: "none" },
			repeat_enabled: t.enabled,
			delay_ms: t.delay_ms,
			interval_ms: t.interval_ms,
			shape: e.shape ?? "rect",
			haptic: e.haptic ?? "light",
			bg: Tt(e.color?.bg),
			fg: Tt(e.color?.fg),
			w: e.position.w ?? 1,
			h: e.position.h ?? 1,
			id: this._idDraft?.forId === e.id ? this._idDraft.text : e.id
		};
	}
	_onChange(e) {
		e.stopPropagation();
		let t = e.detail.value, n = this.button.id, r = String(t.id ?? "");
		if (r !== (this._idDraft?.forId === this.button.id ? this._idDraft.text : this.button.id)) {
			let e = gt(r);
			e ? e !== this.button.id && this.buttons.some((t) => t.id === e) ? this._idError = "Another button already uses this ID." : (this._idError = void 0, n = e) : this._idError = "Use letters, numbers and underscores.", this._idDraft = {
				text: r,
				forId: n
			};
		}
		let i = wt(t.bg), a = wt(t.fg), o = {
			...this.button,
			id: n,
			label: String(t.label ?? ""),
			shape: t.shape,
			haptic: t.haptic,
			tap_action: t.tap_action ?? { action: "none" },
			hold_action: t.hold_action ?? { action: "none" },
			repeat: {
				enabled: !!t.repeat_enabled,
				delay_ms: Number(t.delay_ms) || X.delay_ms,
				interval_ms: Number(t.interval_ms) || X.interval_ms
			},
			position: {
				...this.button.position,
				w: Number(t.w) || 1,
				h: Number(t.h) || 1
			}
		};
		t.icon ? o.icon = String(t.icon) : delete o.icon, i || a ? o.color = {
			...i ? { bg: i } : {},
			...a ? { fg: a } : {}
		} : delete o.color, this.dispatchEvent(new CustomEvent("button-change", { detail: {
			previousId: this.button.id,
			button: o
		} }));
	}
	_fire(e) {
		this.dispatchEvent(new CustomEvent(e, { detail: { id: this.button.id } }));
	}
	render() {
		if (!this.button) return j;
		let e = this._data();
		return k`
      <ha-form
        .hass=${this.hass}
        .data=${e}
        .schema=${this._schema(!!e.repeat_enabled)}
        .error=${this._idError ? { id: this._idError } : void 0}
        .computeLabel=${(e) => St[e.name] ?? e.name}
        .computeHelper=${(e) => Ct[e.name]}
        @value-changed=${this._onChange}
      ></ha-form>
      <div class="actions">
        <button class="secondary" @click=${() => this._fire("button-duplicate")}>Duplicate</button>
        <button class="danger" @click=${() => this._fire("button-delete")}>Delete</button>
      </div>
    `;
	}
};
bt = Et, bt.properties = {
	hass: { attribute: !1 },
	button: { attribute: !1 },
	buttons: { attribute: !1 },
	columns: { type: Number },
	_idError: { state: !0 }
}, bt.styles = o`
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }
    button {
      min-height: 40px;
      padding: 0 16px;
      border-radius: 20px;
      border: 1px solid var(--divider-color, #ccc);
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      cursor: pointer;
    }
    .danger {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }
  `, customElements.get("vr-button-sheet") || customElements.define("vr-button-sheet", Et);
//#endregion
//#region src/editor/canvas.ts
var $, Dt = 8, Ot = class extends R {
	constructor() {
		super(), this._onTouchMove = (e) => {
			this._gesture && this._gesture.kind !== "pending" && e.preventDefault();
		}, this._onPointerMove = (e) => {
			let t = this._gesture;
			if (!t || t.pointerId !== e.pointerId) return;
			if (t.kind === "pending") {
				Math.hypot(e.clientX - t.x, e.clientY - t.y) > Dt && this._cancel();
				return;
			}
			if (t.kind === "resize") {
				this._resizeMove(e);
				return;
			}
			t.el.style.transform = `translate(${e.clientX - t.x}px, ${e.clientY - t.y}px)`;
			let n = this._metrics(), r = this.remote.buttons.find((e) => e.id === t.id);
			if (!n || !r) return;
			let i = G(n), a = i + n.gap, o = t.x - (n.left + r.position.x * a), s = t.y - (n.top + r.position.y * a), c = Ve(n, e.clientX, e.clientY, this._grid.rows) ? Ve(n, e.clientX - o + i / 2, e.clientY - s + i / 2, this._grid.rows) : null, l = c?.x !== t.cell?.x || c?.y !== t.cell?.y;
			if (t.cell = c, !l) return;
			if (!c) {
				B("selection"), this._indicator = void 0, this._setIndicatorForRemove(n);
				return;
			}
			B("selection");
			let u = Ue(this.remote.buttons, t.id, c, n.columns);
			this._setIndicator(n, {
				...r.position,
				...c
			}, !u.ok);
		}, this._onPointerUp = (e) => {
			let t = this._gesture;
			if (!t || t.pointerId !== e.pointerId) return;
			if (t.kind === "pending") {
				this._cancel(), this._emitSelect(t.id);
				return;
			}
			if (t.kind === "resize") {
				this._resizeEnd();
				return;
			}
			let n = t.cell, r = t.id;
			if (this._cancel(), !n) {
				this._emitDelete(r);
				return;
			}
			let i = Ue(this.remote.buttons, r, n, this.remote.grid.columns);
			i.ok ? i.buttons !== this.remote.buttons && this._emit(i.buttons) : B("heavy");
		}, this._cancel = () => {
			let e = this._gesture;
			e && (e.kind === "pending" && window.clearTimeout(e.timer), e.kind === "drag" && Object.assign(e.el.style, {
				transform: "",
				zIndex: "",
				opacity: "",
				pointerEvents: ""
			}), this.hasPointerCapture?.(e.pointerId) && this.releasePointerCapture(e.pointerId), this.classList.remove("dragging"), this._gesture = void 0, this._indicator = void 0, this._preview = void 0);
		}, this._handlePositioned = !1, this.fit = !1;
	}
	connectedCallback() {
		super.connectedCallback(), this.addEventListener("touchmove", this._onTouchMove, { passive: !1 }), this.addEventListener("pointermove", this._onPointerMove), this.addEventListener("pointerup", this._onPointerUp), this.addEventListener("pointercancel", this._cancel);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeEventListener("touchmove", this._onTouchMove), this.removeEventListener("pointermove", this._onPointerMove), this.removeEventListener("pointerup", this._onPointerUp), this.removeEventListener("pointercancel", this._cancel), this._cancel();
	}
	get _grid() {
		return this.renderRoot.querySelector("vr-grid");
	}
	_metrics() {
		let e = this._grid?.surface;
		if (!e) return null;
		let t = e.getBoundingClientRect();
		return {
			left: t.left,
			top: t.top,
			width: t.width,
			columns: this.remote.grid.columns,
			gap: this.remote.grid.gap
		};
	}
	_emit(e) {
		this.dispatchEvent(new CustomEvent("canvas-change", { detail: { buttons: e } }));
	}
	_emitSelect(e) {
		this.dispatchEvent(new CustomEvent("canvas-select", { detail: { id: e } }));
	}
	_emitDelete(e) {
		this.dispatchEvent(new CustomEvent("canvas-delete", { detail: { id: e } }));
	}
	cellAtPoint(e, t) {
		let n = this._metrics();
		return n ? Ve(n, e, t, this._grid.rows) : null;
	}
	showDropPreview(e, t = !1) {
		let n = this._metrics();
		!e || !n ? this._indicator = void 0 : this._setIndicator(n, e, t);
	}
	_onPointerDown(e) {
		if (this._gesture || e.button !== 0) return;
		let t = e.composedPath().find((e) => e instanceof U);
		if (!t) {
			this._emitSelect(void 0);
			return;
		}
		let n = t.button.id, r = window.setTimeout(() => this._arm(), 250);
		this._gesture = {
			kind: "pending",
			id: n,
			pointerId: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			timer: r,
			el: t
		};
	}
	_arm() {
		let e = this._gesture;
		e?.kind === "pending" && (B("medium"), this.setPointerCapture(e.pointerId), this.classList.add("dragging"), Object.assign(e.el.style, {
			zIndex: "2",
			opacity: "0.85",
			pointerEvents: "none"
		}), this._gesture = {
			kind: "drag",
			id: e.id,
			pointerId: e.pointerId,
			x: e.x,
			y: e.y,
			el: e.el,
			cell: null
		}, this._emitSelect(e.id));
	}
	_setIndicator(e, t, n) {
		let r = G(e) + e.gap, i = this.getBoundingClientRect(), a = t.w ?? 1, o = t.h ?? 1;
		this._indicator = {
			left: e.left - i.left + t.x * r,
			top: e.top - i.top + t.y * r,
			width: a * r - e.gap,
			height: o * r - e.gap,
			bad: n,
			remove: !1
		};
	}
	_setIndicatorForRemove(e) {
		let t = this.getBoundingClientRect();
		this._indicator = {
			left: e.left - t.left,
			top: 0,
			width: e.width,
			height: 0,
			bad: !0,
			remove: !0
		};
	}
	_onHandleDown(e) {
		if (e.stopPropagation(), this._gesture || !this.selectedId) return;
		let t = this.remote.buttons.find((e) => e.id === this.selectedId);
		t && (this.setPointerCapture(e.pointerId), this.classList.add("dragging"), this._gesture = {
			kind: "resize",
			id: t.id,
			pointerId: e.pointerId,
			size: {
				w: t.position.w ?? 1,
				h: t.position.h ?? 1
			}
		});
	}
	_resizeMove(e) {
		let t = this._gesture, n = this._metrics();
		if (t?.kind !== "resize" || !n) return;
		let r = this.remote.buttons.find((e) => e.id === t.id), i = G(n) + n.gap, a = Math.max(1, Math.round((e.clientX - (n.left + r.position.x * i) + n.gap) / i)), o = Math.max(1, Math.round((e.clientY - (n.top + r.position.y * i) + n.gap) / i));
		if (a === t.size.w && o === t.size.h) return;
		let s = We(this.remote.buttons, t.id, {
			w: a,
			h: o
		}, n.columns);
		s.ok && (t.size = {
			w: a,
			h: o
		}, B("selection"), this._preview = s.buttons);
	}
	_resizeEnd() {
		let e = this._preview;
		this._cancel(), e && this._emit(e);
	}
	_renderHandle() {
		let e = (this._preview ?? this.remote.buttons).find((e) => e.id === this.selectedId), t = this._metrics();
		if (!e || !t) return j;
		let n = G(t) + t.gap, r = this.getBoundingClientRect();
		return k`<div
      class="handle"
      style="left:${t.left - r.left + (e.position.x + (e.position.w ?? 1)) * n - t.gap}px; top:${t.top - r.top + (e.position.y + (e.position.h ?? 1)) * n - t.gap}px"
      aria-label="Resize"
      @pointerdown=${this._onHandleDown}
    ></div>`;
	}
	updated() {
		this.selectedId && !this._handlePositioned ? (this._handlePositioned = !0, requestAnimationFrame(() => this.requestUpdate())) : this._handlePositioned = !1;
	}
	render() {
		if (!this.remote) return j;
		let e = this._preview ? {
			...this.remote,
			buttons: this._preview
		} : this.remote, t = this._indicator;
		return k`
      <div
        class="canvas"
        @pointerdown=${this._onPointerDown}
        @contextmenu=${(e) => e.preventDefault()}
      >
        <vr-grid .remote=${e} .interactive=${!1} .selectedId=${this.selectedId} .extraRows=${1} ?fit=${this.fit}></vr-grid>
        ${t && !t.remove ? k`<div
              class="indicator ${t.bad ? "bad" : ""}"
              style="left:${t.left}px; top:${t.top}px; width:${t.width}px; height:${t.height}px"
            ></div>` : j}
        ${this._gesture?.kind === "drag" ? j : this._renderHandle()}
      </div>
      <div class="hint ${t?.remove ? "remove" : ""}">
        ${t?.remove ? "Release to delete" : "Tap to edit · hold and drag to move · drag the corner to resize · drop outside to delete"}
      </div>
    `;
	}
};
$ = Ot, $.properties = {
	remote: { attribute: !1 },
	selectedId: { attribute: !1 },
	fit: { type: Boolean },
	_indicator: { state: !0 },
	_preview: { state: !0 }
}, $.styles = o`
    :host {
      display: block;
      position: relative;
    }
    :host([fit]) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    :host([fit]) .canvas {
      flex: 1;
      min-height: 0;
    }
    .canvas {
      position: relative;
      padding: 8px;
      border-radius: 12px;
      /* Same background as the card, so buttons look as they will on the
         dashboard; the dashed edge marks the drop area. */
      background: var(--card-background-color, #fff);
      border: 2px dashed var(--divider-color, #ccc);
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    /* Only while a drag is armed; otherwise the dialog must stay scrollable. */
    :host(.dragging) .canvas {
      touch-action: none;
    }
    .indicator {
      position: absolute;
      box-sizing: border-box;
      border: 2px dashed var(--primary-color, #03a9f4);
      border-radius: 12px;
      pointer-events: none;
      transition: left 60ms, top 60ms;
    }
    .indicator.bad {
      border-color: var(--error-color, #db4437);
    }
    .handle {
      position: absolute;
      width: 28px;
      height: 28px;
      margin: -18px 0 0 -18px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      border: 3px solid var(--card-background-color, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      /* The handle is only for resizing, so it can always block scrolling. */
      touch-action: none;
      cursor: nwse-resize;
      z-index: 3;
    }
    .hint {
      padding: 6px 4px 0;
      font-size: 12px;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .hint.remove {
      color: var(--error-color, #db4437);
      font-weight: 600;
    }
  `, customElements.get("vr-canvas") || customElements.define("vr-canvas", Ot);
//#endregion
//#region src/editor/palette.ts
var kt, At = 8, jt = class extends R {
	constructor(...e) {
		super(...e), this._suppressClick = !1, this._onPointerMove = (e) => {
			let t = this._gesture;
			if (t && e.pointerId === t.pointerId) {
				if (!t.ghost) {
					Math.hypot(e.clientX - t.startX, e.clientY - t.startY) > At && this._cancel();
					return;
				}
				this._moveGhost(t, e.clientX, e.clientY), this._fireDrag(t, e.clientX, e.clientY, "move");
			}
		}, this._onPointerUp = (e) => {
			let t = this._gesture;
			if (t && e.pointerId === t.pointerId) {
				if (!t.ghost) {
					this._cancel();
					return;
				}
				this._suppressClick = !0, window.setTimeout(() => this._suppressClick = !1, 0), this._gesture = void 0, this._cleanup(t), this._fireDrag(t, e.clientX, e.clientY, "drop");
			}
		}, this._cancel = () => {
			let e = this._gesture;
			e && (this._gesture = void 0, this._cleanup(e), e.ghost && this._fireDrag(e, e.startX, e.startY, "cancel"));
		}, this._onTouchMove = (e) => {
			this._gesture?.ghost && e.cancelable && e.preventDefault();
		};
	}
	connectedCallback() {
		super.connectedCallback(), this.addEventListener("pointermove", this._onPointerMove), this.addEventListener("pointerup", this._onPointerUp), this.addEventListener("pointercancel", this._cancel), this.addEventListener("touchmove", this._onTouchMove, { passive: !1 });
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.removeEventListener("pointermove", this._onPointerMove), this.removeEventListener("pointerup", this._onPointerUp), this.removeEventListener("pointercancel", this._cancel), this.removeEventListener("touchmove", this._onTouchMove), this._cancel();
	}
	_fireDrag(e, t, n, r) {
		let i = {
			preset: e.preset,
			clientX: t,
			clientY: n,
			phase: r
		};
		this.dispatchEvent(new CustomEvent("preset-drag", { detail: i }));
	}
	_onPointerDown(e, t) {
		if (e.button !== 0 || this._gesture) return;
		let n = e.currentTarget, r = window.setTimeout(() => this._arm(), 250);
		this._gesture = {
			preset: t,
			pointerId: e.pointerId,
			startX: e.clientX,
			startY: e.clientY,
			el: n,
			timer: r
		};
	}
	_arm() {
		let e = this._gesture;
		e && (this.setPointerCapture(e.pointerId), this.classList.add("dragging"), B("medium"), e.el.classList.add("ghost"), e.ghost = e.el, this._fireDrag(e, e.startX, e.startY, "start"));
	}
	_moveGhost(e, t, n) {
		e.ghost && (e.ghost.style.transform = `translate(${t - e.startX}px, ${n - e.startY}px)`);
	}
	_cleanup(e) {
		window.clearTimeout(e.timer), e.ghost && (e.ghost.classList.remove("ghost"), e.ghost.style.transform = ""), this.hasPointerCapture(e.pointerId) && this.releasePointerCapture(e.pointerId), this.classList.remove("dragging");
	}
	_onClick(e) {
		this._suppressClick || this._pick(e);
	}
	_pick(e) {
		this.dispatchEvent(new CustomEvent("preset-add", { detail: { preset: e } }));
	}
	render() {
		return k`
      <ha-form
        .hass=${this.hass}
        .data=${{ media_player: this.mediaPlayer }}
        .schema=${[{
			name: "media_player",
			selector: { entity: { filter: { domain: "media_player" } } }
		}]}
        .computeLabel=${() => "Media player (optional)"}
        .computeHelper=${() => "Volume, power and playback buttons are wired to it automatically."}
        @value-changed=${(e) => {
			e.stopPropagation(), this.dispatchEvent(new CustomEvent("media-player-change", { detail: { entityId: e.detail.value.media_player || void 0 } }));
		}}
      ></ha-form>
      <div class="presets">
        ${ft.map((e) => k`
            <button
              class="preset"
              @pointerdown=${(t) => this._onPointerDown(t, e)}
              @click=${() => this._onClick(e)}
              @contextmenu=${(e) => e.preventDefault()}
            >
              <ha-icon .icon=${e.icon}></ha-icon>
              <span>${e.name}</span>
              <small>${e.buttons.length > 1 ? `${e.buttons.length} buttons` : "1 button"}</small>
            </button>
          `)}
      </div>
    `;
	}
};
kt = jt, kt.properties = {
	hass: { attribute: !1 },
	mediaPlayer: { attribute: !1 }
}, kt.styles = o`
    .presets {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
      gap: 8px;
      margin-top: 12px;
    }
    .preset {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-height: 84px;
      padding: 10px 6px;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .preset:active {
      transform: scale(0.96);
    }
    /* Only while a drag is armed, so the dialog still scrolls. */
    :host(.dragging) .preset {
      touch-action: none;
    }
    .preset.ghost {
      position: relative;
      pointer-events: none;
      opacity: 0.85;
      z-index: 10;
      transition: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .preset {
      -webkit-user-select: none;
      user-select: none;
      -webkit-touch-callout: none;
    }
    small {
      color: var(--secondary-text-color);
      font-size: 11px;
    }
  `, customElements.get("vr-palette") || customElements.define("vr-palette", jt);
//#endregion
//#region src/editor/editor.ts
var Mt, Nt = [
	{
		mode: "arrange",
		label: "Arrange",
		icon: "mdi:drag-variant"
	},
	{
		mode: "add",
		label: "Add",
		icon: "mdi:plus-box-multiple"
	},
	{
		mode: "button",
		label: "Button",
		icon: "mdi:gesture-tap-button"
	},
	{
		mode: "remote",
		label: "Remote",
		icon: "mdi:remote"
	}
], Pt = 600, Ft = 6e3, It = class extends R {
	constructor() {
		super(), this._mode = "arrange", this._saveState = { state: "idle" }, this._editIndex = 0, this._ready = !1, this._expanded = !1;
	}
	setConfig(e) {
		this._config = e;
		let t = Z(e);
		this._editIndex >= t.length && (this._editIndex = 0), t.length ? this._maybeLoad() : (this._loadedKey = "inline", this._remote = dt(e), this._loadError = void 0);
	}
	connectedCallback() {
		super.connectedCallback(), ke().catch(() => void 0).finally(() => this._ready = !0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._flushSave();
	}
	willUpdate() {
		this.hass && this._config && (this._maybeLoad(), this._stored || this._loadStoredList());
	}
	get _editingId() {
		return Z(this._config)[this._editIndex];
	}
	get _isInline() {
		return !Z(this._config).length;
	}
	async _maybeLoad() {
		let e = this._editingId;
		if (e && this.hass && this._loadedKey !== e) {
			this._flushSave(), this._loadedKey = e, this._remote = void 0, this._loadError = void 0, this._selectedId = void 0;
			try {
				let t = await this.hass.callWS({
					type: "virtual_remote/get",
					remote_id: e
				});
				this._loadedKey === e && (this._remote = t);
			} catch (t) {
				this._loadedKey === e && (this._loadError = H(t));
			}
		}
	}
	async _loadStoredList() {
		this._stored = [];
		try {
			let { remotes: e } = await this.hass.callWS({ type: "virtual_remote/list" });
			this._stored = e.map((e) => ({
				id: e.id,
				name: e.name
			}));
		} catch (e) {
			this._notice = `Could not list stored remotes: ${H(e)}`;
		}
	}
	_fireConfig(e) {
		this._config = e, z(this, "config-changed", { config: e });
	}
	_commit(e) {
		if (this._remote = e, this._isInline) {
			let { name: t, icon: n, grid: r, buttons: i } = e, a = {
				...this._config,
				grid: r,
				buttons: i
			};
			t ? a.name = t : delete a.name, n ? a.icon = n : delete a.icon, this._fireConfig(a);
			return;
		}
		this._pendingSave = {
			remoteId: this._editingId,
			remote: e
		}, this._saveState = { state: "saving" }, window.clearTimeout(this._saveTimer), this._saveTimer = window.setTimeout(() => this._flushSave(), Pt);
	}
	async _flushSave() {
		window.clearTimeout(this._saveTimer);
		let e = this._pendingSave;
		if (e && this.hass) {
			this._pendingSave = void 0;
			try {
				let t = await this.hass.callWS({
					type: "virtual_remote/save",
					remote_id: e.remoteId,
					grid: e.remote.grid,
					buttons: e.remote.buttons
				});
				!this._pendingSave && this._loadedKey === e.remoteId && (this._remote = t), this._pendingSave || (this._saveState = { state: "saved" });
			} catch (e) {
				this._saveState = {
					state: "error",
					message: H(e)
				};
			}
		}
	}
	_setButtons(e) {
		this._remote && this._commit({
			...this._remote,
			buttons: e
		});
	}
	_deleteButton(e) {
		if (!this._remote) return;
		let t = this._remote.buttons, n = t.find((t) => t.id === e);
		n && (B("medium"), this._setButtons(t.filter((t) => t.id !== e)), this._selectedId === e && (this._selectedId = void 0), this._offerUndo(t, `Deleted ${n.label || n.id}`));
	}
	_offerUndo(e, t) {
		this._undo && window.clearTimeout(this._undo.timer);
		let n = window.setTimeout(() => this._undo = void 0, Ft);
		this._undo = {
			buttons: e,
			message: t,
			timer: n
		};
	}
	_applyUndo() {
		this._undo &&= (window.clearTimeout(this._undo.timer), this._setButtons(this._undo.buttons), void 0);
	}
	_duplicateButton(e) {
		if (!this._remote) return;
		let t = this._remote.buttons, n = t.find((t) => t.id === e);
		if (!n) return;
		let r = n.position.w ?? 1, i = n.position.h ?? 1, a = {
			...structuredClone(n),
			id: Ke(t, n.id),
			position: {
				...q(t, r, i, this._remote.grid.columns),
				w: r,
				h: i
			}
		};
		this._setButtons([...t, a]), this._selectedId = a.id;
	}
	_onButtonChange(e) {
		if (!this._remote) return;
		let { previousId: t, button: n } = e.detail, r = this._remote.buttons, i = r.find((e) => e.id === t);
		if (!i) return;
		let a = n, o = {
			w: a.position.w ?? 1,
			h: a.position.h ?? 1
		};
		(o.w !== (i.position.w ?? 1) || o.h !== (i.position.h ?? 1)) && (We(r, t, o, this._remote.grid.columns).ok || (this._notice = "That size would overlap another button or leave the grid.", a = {
			...a,
			position: i.position
		})), r = r.map((e) => e.id === t ? a : e), this._selectedId = a.id, this._setButtons(r);
	}
	_addPreset(e) {
		if (!this._remote) return;
		let t = ht(this._remote.buttons, e, this._remote.grid.columns, this._mediaPlayer) ?? [];
		B("light"), this._setButtons([...this._remote.buttons, ...t]), this._selectedId = t.length === 1 ? t[0].id : void 0, this._notice = `Added ${e.name}`;
	}
	_onPresetDrag(e) {
		let t = this.renderRoot.querySelector("vr-canvas"), n = this._remote;
		if (!t || !n) return;
		let { preset: r, clientX: i, clientY: a, phase: o } = e.detail;
		if (o === "start" || o === "cancel") {
			t.showDropPreview(null);
			return;
		}
		let s = t.cellAtPoint(i, a), c = s ? ht(n.buttons, r, n.grid.columns, this._mediaPlayer, s) : null;
		if (o === "move") {
			t.showDropPreview(s ? {
				...s,
				...pt(r)
			} : null, !c);
			return;
		}
		t.showDropPreview(null), c ? (B("light"), this._setButtons([...n.buttons, ...c]), this._selectedId = c.length === 1 ? c[0].id : void 0, this._notice = `Added ${r.name}`) : s && (B("heavy"), this._notice = `${r.name} doesn't fit there.`);
	}
	_remoteSchema() {
		let e = this._stored ?? [], t = this._isInline, n = Z(this._config).length > 1;
		return [
			{
				name: "source",
				selector: { select: {
					mode: "list",
					options: [{
						value: "stored",
						label: "Stored remote (shared, works in automations)"
					}, {
						value: "inline",
						label: "Inline buttons (only in this card)"
					}]
				} }
			},
			...t ? [] : [{
				name: "remotes",
				selector: { select: {
					multiple: !0,
					options: e.map((e) => ({
						value: e.id,
						label: e.name
					}))
				} }
			}],
			...n ? [{
				name: "profile_entity",
				selector: { entity: { filter: { domain: ["input_select", "select"] } } }
			}] : [],
			...t ? [{
				type: "grid",
				name: "",
				schema: [{
					name: "name",
					selector: { text: {} }
				}, {
					name: "icon",
					selector: { icon: {} }
				}]
			}] : [],
			{
				type: "grid",
				name: "",
				schema: [
					{
						name: "columns",
						selector: { number: {
							min: 1,
							max: 12,
							mode: "slider"
						} }
					},
					{
						name: "gap",
						selector: { number: {
							min: 0,
							max: 32,
							mode: "slider",
							unit_of_measurement: "px"
						} }
					},
					{
						name: "show_header",
						selector: { boolean: {} }
					},
					{
						name: "fullscreen",
						selector: { boolean: {} }
					}
				]
			}
		];
	}
	_remoteData() {
		let e = this._remote?.grid ?? st;
		return {
			source: this._isInline ? "inline" : "stored",
			remotes: Z(this._config),
			profile_entity: this._config.profile_entity,
			name: this._config.name ?? "",
			icon: this._config.icon ?? "",
			columns: e.columns,
			gap: e.gap,
			show_header: this._config.show_header !== !1,
			fullscreen: this._config.fullscreen !== !1
		};
	}
	_onRemoteChange(e) {
		e.stopPropagation();
		let t = e.detail.value, n = this._remoteData(), r = { ...this._config };
		for (let e of ["show_header", "fullscreen"]) t[e] ? delete r[e] : r[e] = !1;
		if (t.source !== n.source) {
			if (t.source === "inline") {
				let e = this._remote ?? dt({ type: r.type }), { remote_id: t, profiles: n, profile_entity: i, ...a } = r;
				r = {
					...a,
					name: e.name,
					grid: e.grid,
					buttons: structuredClone(e.buttons)
				}, this._loadedKey = "inline";
			} else {
				let e = this._stored?.[0]?.id;
				if (!e) {
					this._notice = "Create a remote first under Settings → Devices & services → Add integration → Virtual Remote.";
					return;
				}
				let { buttons: t, grid: n, name: i, icon: a, ...o } = r;
				r = {
					...o,
					remote_id: e
				};
			}
			this._editIndex = 0, this._fireConfig(r), this.setConfig(r);
			return;
		}
		if (!this._isInline && JSON.stringify(t.remotes) !== JSON.stringify(n.remotes)) {
			let e = t.remotes ?? [], { remote_id: n, profiles: i, ...a } = r;
			if (r = a, e.length === 1) r.remote_id = e[0];
			else if (e.length > 1) {
				let t = new Map((i ?? []).map((e) => [e.remote_id, e]));
				r.profiles = e.map((e) => t.get(e) ?? { remote_id: e });
			} else {
				this._notice = "Pick at least one remote.";
				return;
			}
			e.length < 2 && delete r.profile_entity, this._editIndex = 0;
		}
		if (t.profile_entity !== n.profile_entity && (t.profile_entity ? r.profile_entity = t.profile_entity : delete r.profile_entity), this._isInline && (r.name = t.name || void 0, r.icon = t.icon || void 0, r.name || delete r.name, r.icon || delete r.icon), this._fireConfig(r), this.setConfig(r), this._remote && (t.columns !== n.columns || t.gap !== n.gap)) {
			let e = {
				columns: Number(t.columns),
				gap: Number(t.gap)
			}, n = e.columns < this._remote.grid.columns ? Ge(this._remote.buttons, e.columns) : this._remote.buttons;
			this._commit({
				...this._remote,
				...this._isInline ? {
					name: r.name ?? "",
					icon: r.icon
				} : {},
				grid: e,
				buttons: n
			});
		} else this._isInline && this._remote && (this._remote = {
			...this._remote,
			name: r.name ?? "",
			icon: r.icon
		});
	}
	async _createProfileHelper() {
		let e = Z(this._config).map((e) => this._stored?.find((t) => t.id === e)?.name ?? e);
		try {
			let t = await this.hass.callWS({
				type: "input_select/create",
				name: `${this._config.name ?? e[0]} profile`,
				icon: "mdi:remote",
				options: e
			});
			this._fireConfig({
				...this._config,
				profile_entity: `input_select.${t.id}`
			}), this._notice = "Created a shared profile helper.";
		} catch (e) {
			this._notice = `Could not create the helper: ${H(e)}`;
		}
	}
	_renderStatus() {
		let e = this._saveState;
		if (this._isInline || e.state === "idle") return j;
		let t = {
			saving: "Saving…",
			saved: "Saved",
			error: `Save failed: ${e.message}`
		}[e.state];
		return k`<span class="status ${e.state}">${t}</span>`;
	}
	_renderProfilePicker() {
		let e = Z(this._config);
		return e.length < 2 ? j : k`
      <div class="editing">
        <span>Editing</span>
        ${e.map((e, t) => k`<button
            class="chip ${t === this._editIndex ? "on" : ""}"
            @click=${() => {
			this._editIndex = t, this._maybeLoad();
		}}
          >
            ${this._stored?.find((t) => t.id === e)?.name ?? e}
          </button>`)}
      </div>
    `;
	}
	_renderArrange() {
		let e = this._remote, t = e.buttons.find((e) => e.id === this._selectedId), n = (t) => k`
      <vr-canvas
        .remote=${e}
        .selectedId=${this._selectedId}
        ?fit=${t}
        @canvas-change=${(e) => this._setButtons(e.detail.buttons)}
        @canvas-select=${(e) => this._selectedId = e.detail.id}
        @canvas-delete=${(e) => this._deleteButton(e.detail.id)}
      ></vr-canvas>
    `;
		return k`
      ${e.buttons.length ? j : k`<p class="empty">No buttons yet. Open <b>Add</b> to drop in a d-pad, volume keys and more.</p>`}
      ${this._expanded ? j : n(!1)}
      <div class="toolbar">
        ${t ? k`
              <span class="sel">${t.label || t.id}</span>
              <button class="chip" @click=${() => this._mode = "button"}>Edit</button>
              <button class="chip" @click=${() => this._duplicateButton(t.id)}>Duplicate</button>
              <button class="chip danger" @click=${() => this._deleteButton(t.id)}>Delete</button>
            ` : k`<span class="sel muted">Nothing selected</span>`}
        <button class="chip" aria-label="Expand" @click=${this._expand}>
          <ha-icon icon="mdi:arrow-expand"></ha-icon>
        </button>
      </div>
      ${this._expanded ? k`<dialog class="expanded" @close=${() => this._expanded = !1}>
            <div class="expanded-inner">
              <div class="expanded-head">
                <span>Arrange ${e.name}</span>
                <button class="chip" @click=${this._collapse}>Done</button>
              </div>
              ${n(!0)}
              ${this._renderUndo()}
            </div>
          </dialog>` : j}
    `;
	}
	_expand() {
		this._expanded = !0, this.updateComplete.then(() => this.renderRoot.querySelector("dialog.expanded")?.showModal());
	}
	_collapse() {
		this.renderRoot.querySelector("dialog.expanded")?.close();
	}
	_renderButtonMode() {
		let e = this._remote, t = e.buttons.find((e) => e.id === this._selectedId);
		return k`
      <div class="chips">
        ${e.buttons.map((e) => k`<button class="chip ${e.id === this._selectedId ? "on" : ""}" @click=${() => this._selectedId = e.id}>
            ${e.icon ? k`<ha-icon .icon=${e.icon}></ha-icon>` : j}${e.label || e.id}
          </button>`)}
      </div>
      ${t ? k`<vr-button-sheet
            .hass=${this.hass}
            .button=${t}
            .buttons=${e.buttons}
            .columns=${e.grid.columns}
            @button-change=${this._onButtonChange}
            @button-delete=${(e) => this._deleteButton(e.detail.id)}
            @button-duplicate=${(e) => this._duplicateButton(e.detail.id)}
          ></vr-button-sheet>` : k`<p class="empty">${e.buttons.length ? "Pick a button above, or tap one in Arrange." : "Add some buttons first."}</p>`}
    `;
	}
	_renderRemoteMode() {
		let e = Z(this._config).length > 1;
		return k`
      <ha-form
        .hass=${this.hass}
        .data=${this._remoteData()}
        .schema=${this._remoteSchema()}
        .computeLabel=${(e) => ({
			source: "Buttons come from",
			remotes: "Remotes (pick several to swap between them as profiles)",
			profile_entity: "Shared profile helper",
			name: "Name",
			icon: "Icon",
			columns: "Columns",
			gap: "Spacing",
			show_header: "Show title",
			fullscreen: "Fullscreen button"
		})[e.name] ?? e.name}
        .computeHelper=${(e) => e.name === "profile_entity" ? "An input_select whose options are the remote names. Every device follows it, and automations can switch it." : void 0}
        @value-changed=${this._onRemoteChange}
      ></ha-form>
      ${e && !this._config.profile_entity ? k`<button class="chip wide" @click=${this._createProfileHelper}>
            <ha-icon icon="mdi:plus"></ha-icon> Create a shared profile helper
          </button>` : j}
      ${this._isInline ? j : k`<p class="note">
            Rename a stored remote or change its icon in Settings → Devices & services → Virtual Remote.
          </p>`}
    `;
	}
	_renderUndo() {
		return this._undo ? k`<div class="undo">
      <span>${this._undo.message}</span>
      <button @click=${this._applyUndo}>Undo</button>
    </div>` : j;
	}
	render() {
		if (!this._config || !this.hass) return j;
		if (!this._ready) return k`<p class="empty">Loading editor…</p>`;
		let e;
		return e = this._mode === "remote" ? this._renderRemoteMode() : this._loadError ? k`<p class="error">${this._loadError}</p>` : this._remote ? this._mode === "arrange" ? this._renderArrange() : this._mode === "add" ? k`<vr-palette
          .hass=${this.hass}
          .mediaPlayer=${this._mediaPlayer}
          @media-player-change=${(e) => this._mediaPlayer = e.detail.entityId}
          @preset-add=${(e) => this._addPreset(e.detail.preset)}
          @preset-drag=${this._onPresetDrag}
        ></vr-palette>
        <p class="note">Tap a preset to add it, or hold and drag it onto the layout.</p>
        <vr-canvas
          class="preview"
          .remote=${this._remote}
          .selectedId=${this._selectedId}
          @canvas-change=${(e) => this._setButtons(e.detail.buttons)}
          @canvas-select=${(e) => this._selectedId = e.detail.id}
          @canvas-delete=${(e) => this._deleteButton(e.detail.id)}
        ></vr-canvas>` : this._renderButtonMode() : k`<p class="empty">Loading remote…</p>`, k`
      ${this._renderProfilePicker()}
      <div class="modes" role="tablist">
        ${Nt.map((e) => k`<button
            role="tab"
            class="mode"
            aria-selected=${this._mode === e.mode}
            @click=${() => {
			this._mode = e.mode, this._notice = void 0;
		}}
          >
            <ha-icon .icon=${e.icon}></ha-icon><span>${e.label}</span>
          </button>`)}
      </div>
      <div class="statusbar">${this._renderStatus()}</div>
      ${this._notice ? k`<p class="notice">${this._notice}</p>` : j}
      <div class="body">${e}</div>
      ${this._expanded ? j : this._renderUndo()}
    `;
	}
};
Mt = It, Mt.properties = {
	hass: { attribute: !1 },
	_config: { state: !0 },
	_remote: { state: !0 },
	_loadError: { state: !0 },
	_mode: { state: !0 },
	_selectedId: { state: !0 },
	_saveState: { state: !0 },
	_stored: { state: !0 },
	_editIndex: { state: !0 },
	_undo: { state: !0 },
	_ready: { state: !0 },
	_mediaPlayer: { state: !0 },
	_expanded: { state: !0 },
	_notice: { state: !0 }
}, Mt.styles = o`
    :host {
      display: block;
    }
    .modes {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 4px;
      border-radius: 14px;
      background: var(--secondary-background-color, #eee);
    }
    .mode {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-height: 52px;
      border: none;
      border-radius: 10px;
      background: none;
      color: var(--secondary-text-color);
      font: inherit;
      font-size: 12px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .mode[aria-selected="true"] {
      background: var(--card-background-color, #fff);
      color: var(--primary-color, #03a9f4);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    .statusbar {
      min-height: 18px;
      text-align: right;
      font-size: 12px;
      padding: 4px 2px;
    }
    .status {
      color: var(--secondary-text-color);
    }
    .status.error {
      color: var(--error-color, #db4437);
    }
    .body {
      padding-bottom: 8px;
    }
    .editing,
    .chips,
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin: 8px 0;
    }
    .editing > span {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 36px;
      padding: 0 12px;
      border-radius: 18px;
      border: 1px solid var(--divider-color, #ccc);
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .chip ha-icon {
      --mdc-icon-size: 18px;
    }
    .chip.on {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .chip.danger {
      color: var(--error-color, #db4437);
    }
    .chip.wide {
      width: 100%;
      justify-content: center;
      margin-top: 8px;
    }
    .toolbar .sel {
      flex: 1;
      min-width: 80px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .muted {
      color: var(--secondary-text-color);
      font-weight: normal !important;
    }
    .empty,
    .note {
      color: var(--secondary-text-color);
      font-size: 14px;
    }
    .error,
    .notice {
      font-size: 14px;
    }
    .error {
      color: var(--error-color, #db4437);
    }
    .notice {
      margin: 4px 0;
      color: var(--primary-color, #03a9f4);
    }
    .preview {
      margin-top: 16px;
      opacity: 0.9;
    }
    .undo {
      position: sticky;
      bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 8px 8px 16px;
      border-radius: 8px;
      background: var(--primary-text-color, #333);
      color: var(--card-background-color, #fff);
      font-size: 14px;
      z-index: 5;
    }
    .undo button {
      margin-left: auto;
      min-height: 36px;
      border: none;
      background: none;
      color: var(--primary-color, #03a9f4);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    dialog.expanded {
      box-sizing: border-box;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
    }
    .expanded-inner {
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: calc(12px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right))
        calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left));
    }
    .expanded-inner vr-canvas {
      flex: 1;
      min-height: 0;
    }
    .expanded-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
    }
  `, customElements.get("virtual-remote-card-editor") || customElements.define("virtual-remote-card-editor", It);
//#endregion
//#region src/card.ts
var Lt, Rt = "0.3.0", zt = 60, Bt = 3e3, Vt = !1, Ht = class extends R {
	constructor() {
		super(), this._unsubs = [], this._inFlight = /* @__PURE__ */ new Set(), this._slots = {}, this._localIndex = 0, this._fullscreen = !1;
	}
	static getConfigElement() {
		return document.createElement("virtual-remote-card-editor");
	}
	static getStubConfig(e) {
		let t = Object.values(e?.states ?? {}).find((e) => e.entity_id.startsWith("remote.") && typeof e.attributes.remote_id == "string");
		return t ? { remote_id: t.attributes.remote_id } : {
			name: "Remote",
			grid: { columns: 3 },
			buttons: [
				{
					id: "vol_up",
					icon: "mdi:volume-plus",
					position: {
						x: 0,
						y: 0,
						w: 1,
						h: 1
					}
				},
				{
					id: "mute",
					icon: "mdi:volume-mute",
					position: {
						x: 1,
						y: 0,
						w: 1,
						h: 1
					}
				},
				{
					id: "vol_down",
					icon: "mdi:volume-minus",
					position: {
						x: 2,
						y: 0,
						w: 1,
						h: 1
					}
				}
			]
		};
	}
	setConfig(e) {
		if (!e) throw Error("Invalid configuration");
		if (!e.remote_id && !e.profiles?.length && !e.buttons) throw Error("Set remote_id, profiles, or inline buttons");
		if (e.profiles?.some((e) => !e?.remote_id)) throw Error("Every profile needs a remote_id");
		this._config = e;
	}
	connectedCallback() {
		super.connectedCallback(), this._subscribedFor = void 0, this.hass && this.requestUpdate();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._unsubscribe();
	}
	willUpdate(e) {
		if (!this.hass || !this._config) return;
		let t = JSON.stringify(Z(this._config));
		this.isConnected && t !== this._subscribedFor && (this._subscribedFor = t, this._subscribe()), e.has("hass") && !Vt && (Vt = !0, this._checkVersion());
	}
	_subscribe() {
		this._unsubscribe();
		let e = {};
		for (let t of Z(this._config)) {
			e[t] = this._slots[t] ?? { loading: !0 };
			let n = this.hass.connection.subscribeMessage(({ remote: e }) => {
				this._slots = {
					...this._slots,
					[t]: e ? { remote: e } : { error: `Remote "${t}" was deleted` }
				};
			}, {
				type: "virtual_remote/subscribe",
				remote_id: t
			});
			n.catch((e) => {
				this._slots = {
					...this._slots,
					[t]: { error: H(e) }
				};
			}), this._unsubs.push(n);
		}
		this._slots = e;
	}
	_unsubscribe() {
		for (let e of this._unsubs) e.then((e) => e()).catch(() => void 0);
		this._unsubs = [];
	}
	async _checkVersion() {
		try {
			let { version: e } = await this.hass.callWS({ type: "virtual_remote/version" });
			e !== "0.3.0" && (this._staleVersion = e);
		} catch {}
	}
	async _reload() {
		try {
			if ("caches" in window) for (let e of await caches.keys()) await caches.delete(e);
		} finally {
			location.reload();
		}
	}
	get _profiles() {
		return Z(this._config).map((e, t) => {
			let n = this._slots[e];
			return {
				remoteId: e,
				name: this._config.profiles?.[t]?.name ?? (n && "remote" in n ? n.remote.name : void 0) ?? e
			};
		});
	}
	get _activeIndex() {
		let e = Z(this._config).length;
		if (this._pending && this._pending.until > Date.now()) return this._pending.index;
		let t = this._config.profile_entity;
		if (t) {
			let e = vt(this._profiles, this.hass.states[t]?.state);
			if (e >= 0) return e;
		}
		return Math.min(this._localIndex, Math.max(0, e - 1));
	}
	async _selectProfile(e) {
		let t = this._profiles;
		if (e < 0 || e >= t.length || e === this._activeIndex) return;
		B("selection"), this._localIndex = e;
		let n = this._config.profile_entity;
		if (!n) return;
		let r = this.hass.states[n], i = yt(r?.attributes.options ?? [], t[e]);
		if (!i) {
			V(this, `${n} has no option for "${t[e].name}"`);
			return;
		}
		this._pending = {
			index: e,
			until: Date.now() + Bt
		}, window.setTimeout(() => this._pending = void 0, Bt);
		try {
			await this.hass.callService(n.split(".")[0], "select_option", { option: i }, { entity_id: n });
		} catch (e) {
			this._pending = void 0, V(this, H(e));
		}
	}
	_onSwipeStart(e) {
		!e.isPrimary || Z(this._config).length < 2 || (this._swipe = {
			id: e.pointerId,
			x: e.clientX,
			y: e.clientY,
			t: e.timeStamp
		});
	}
	_onSwipeEnd(e) {
		let t = this._swipe;
		if (this._swipe = void 0, !t || t.id !== e.pointerId || e.timeStamp - t.t > 700) return;
		let n = e.clientX - t.x, r = e.clientY - t.y;
		Math.abs(n) < zt || Math.abs(r) > Math.abs(n) / 2 || this._selectProfile(this._activeIndex + (n < 0 ? 1 : -1));
	}
	_current() {
		let e = Z(this._config);
		if (!e.length) return { remote: dt(this._config) };
		let t = e[this._activeIndex], n = this._slots[t] ?? { loading: !0 };
		return "remote" in n ? {
			remote: n.remote,
			remoteId: t
		} : "error" in n ? {
			remoteId: t,
			error: n.error
		} : {
			remoteId: t,
			loading: !0
		};
	}
	async _onPress(e) {
		let { button: t, hold: n, repeat: r } = e.detail;
		this._swipe = void 0;
		let i = e.composedPath().find((e) => e instanceof U);
		if (r && this._inFlight.has(t.id)) return;
		let { remoteId: a } = this._current(), o;
		if (a && (o = Fe(this.hass, a), !o)) {
			i?.flashError(), V(this, `No remote entity found for "${a}". Is it disabled?`);
			return;
		}
		this._inFlight.add(t.id);
		try {
			await Ne({
				hass: this.hass,
				node: this,
				entityId: o
			}, t, n);
		} catch (e) {
			i?.flashError(), V(this, H(e));
		} finally {
			this._inFlight.delete(t.id);
		}
	}
	_openFullscreen() {
		this._fullscreen = !0, this.updateComplete.then(() => this.renderRoot.querySelector("dialog")?.showModal());
	}
	_closeFullscreen() {
		this.renderRoot.querySelector("dialog")?.close();
	}
	_renderTabs() {
		let e = this._profiles;
		if (e.length < 2) return j;
		let t = this._activeIndex;
		return k`
      <div class="tabs" role="tablist">
        ${e.map((e, n) => k`
            <button
              role="tab"
              class="tab"
              aria-selected=${n === t}
              @click=${() => this._selectProfile(n)}
            >
              ${this._config.profiles?.[n]?.icon ? k`<ha-icon .icon=${this._config.profiles[n].icon}></ha-icon>` : j}
              <span>${e.name}</span>
            </button>
          `)}
      </div>
    `;
	}
	_renderBody(e) {
		let t = this._current(), n;
		return n = t.error ? k`<div class="message error">${t.error}</div>` : t.loading || !t.remote ? k`<div class="message">Loading…</div>` : t.remote.buttons.length ? k`<vr-grid .remote=${t.remote} ?fit=${e}></vr-grid>` : k`<div class="message">No buttons yet. Edit the card to add some.</div>`, k`
      <div
        class="body"
        @vr-press=${this._onPress}
        @pointerdown=${this._onSwipeStart}
        @pointerup=${this._onSwipeEnd}
        @pointercancel=${() => this._swipe = void 0}
      >
        ${n}
      </div>
    `;
	}
	_title() {
		let e = this._current(), t = this._config.profiles?.[this._activeIndex];
		return {
			name: this._config.name ?? t?.name ?? e.remote?.name ?? e.remoteId ?? "",
			icon: this._config.icon ?? t?.icon ?? e.remote?.icon
		};
	}
	render() {
		if (!this._config || !this.hass) return j;
		let { name: e, icon: t } = this._title(), n = this._config.show_header !== !1, r = this._config.fullscreen !== !1;
		return k`
      <ha-card>
        ${this._staleVersion ? k`<div class="stale">
              Virtual Remote was updated (${Rt} → ${this._staleVersion}).
              <button @click=${this._reload}>Reload</button>
            </div>` : j}
        ${n ? k`<div class="header">
              ${t ? k`<ha-icon .icon=${t}></ha-icon>` : j}
              <span class="name">${e}</span>
              ${r ? k`<button class="icon-btn" aria-label="Fullscreen" @click=${this._openFullscreen}>
                    <ha-icon icon="mdi:fullscreen"></ha-icon>
                  </button>` : j}
            </div>` : j}
        ${this._renderTabs()} ${this._renderBody(!1)}
      </ha-card>
      ${this._fullscreen ? k`<dialog @close=${() => this._fullscreen = !1} @cancel=${this._closeFullscreen}>
            <div class="fs">
              <div class="header">
                ${t ? k`<ha-icon .icon=${t}></ha-icon>` : j}
                <span class="name">${e}</span>
                <button class="icon-btn" aria-label="Close" @click=${this._closeFullscreen}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
              </div>
              ${this._renderTabs()}
              <div class="fs-body">${this._renderBody(!0)}</div>
            </div>
          </dialog>` : j}
    `;
	}
	getCardSize() {
		let e = this._current().remote, t = e ? Re(e.buttons) : 2;
		return Math.max(2, Math.ceil(t * 1.5)) + (this._config?.show_header === !1 ? 0 : 1);
	}
	getGridOptions() {
		return {
			columns: 6,
			min_columns: 3
		};
	}
};
Lt = Ht, Lt.properties = {
	hass: { attribute: !1 },
	_config: { state: !0 },
	_slots: { state: !0 },
	_localIndex: { state: !0 },
	_pending: { state: !0 },
	_staleVersion: { state: !0 },
	_fullscreen: { state: !0 }
}, Lt.styles = o`
    ha-card {
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 4px;
      font-size: 16px;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .name {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin: -8px -8px -8px 0;
      border: none;
      background: none;
      color: var(--secondary-text-color);
      border-radius: 50%;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .tabs {
      display: flex;
      gap: 6px;
      padding: 8px 16px 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tabs::-webkit-scrollbar {
      display: none;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 0 0 auto;
      min-height: 36px;
      padding: 0 14px;
      border-radius: 18px;
      border: 1px solid var(--divider-color, #ccc);
      background: none;
      color: var(--primary-text-color);
      font: inherit;
      font-size: 14px;
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .tab ha-icon {
      --mdc-icon-size: 18px;
    }
    .tab[aria-selected="true"] {
      background: var(--primary-color, #03a9f4);
      border-color: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    .body {
      padding: 12px 16px 16px;
      /* Vertical scroll stays with the page; horizontal moves are our swipe. */
      touch-action: pan-y;
    }
    .message {
      padding: 16px 0;
      color: var(--secondary-text-color);
      text-align: center;
    }
    .message.error {
      color: var(--error-color, #db4437);
    }
    .stale {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--warning-color, #ffa600);
      color: #000;
      font-size: 13px;
    }
    .stale button {
      margin-left: auto;
      min-height: 32px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
    }
    dialog {
      box-sizing: border-box;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      background: var(--primary-background-color, #fafafa);
      color: var(--primary-text-color);
    }
    dialog::backdrop {
      background: var(--primary-background-color, #fafafa);
    }
    .fs {
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
        env(safe-area-inset-left);
    }
    .fs .header {
      padding-top: 16px;
    }
    .fs-body {
      flex: 1;
      min-height: 0;
    }
    .fs-body .body {
      height: 100%;
      box-sizing: border-box;
    }
  `, customElements.get("virtual-remote-card") || (customElements.define("virtual-remote-card", Ht), window.customCards = window.customCards ?? [], window.customCards.push({
	type: "virtual-remote-card",
	name: "Virtual Remote",
	description: "A touch-friendly remote with a drag-and-drop layout editor.",
	preview: !0,
	documentationURL: "https://github.com/kozelkevinr-create/virtual-remote"
}));
//#endregion
export { Rt as CARD_VERSION, Ht as VirtualRemoteCard };
