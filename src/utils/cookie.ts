export interface CookieOptions {
	name: string;
	value: string;
	expiresIn?: number;
	path?: string;
	domain?: string;
	secure?: boolean;
	httpOnly?: boolean;
}

export class Cookie {
	public name: string;
	public value: string;
	public maxAge: number;
	public expiresIn?: Date;
	public path?: string;
	public domain?: string;
	public secure?: boolean;
	public httpOnly?: boolean;
	public sameSite?: boolean;

	constructor(
		name: string,
		value: string,
		maxAge?: number,
		expiresIn?: Date,
		path?: string,
		domain?: string,
		secure?: boolean,
		httpOnly?: boolean,
		sameSite?: boolean
	) {
		this.name = name;
		this.value = value;
		this.maxAge = maxAge;
		this.expiresIn = expiresIn;
		this.path = path;
		this.domain = domain;
		this.secure = secure;
		this.httpOnly = httpOnly;
		this.sameSite = sameSite;
	}

	/**
	 * Parse a cookie string into a cookie object.
	 *
	 * @param cookieString A cookie string of format like that in the `set-cookie` header
	 * @returns Cookie | null
	 */
	static from(cookieString: string): Cookie | null {

		const cookieParts = cookieString.split(";").map((part) => part.trim());

		if (cookieParts.length === 0) {
			return null; // Invalid cookie string
		}

		const [name, value] = cookieParts[0].split("=");

		const cookie = new Cookie(name, value);

		for (const attribute of cookieParts.slice(1)) {
			var [key, attributeValue] = attribute.split("=").map((part) => part.trim());
			switch (key.toLowerCase()) {
				case "path":
					cookie.path = attributeValue;
					break;
				case "domain":
					cookie.domain = attributeValue;
					break;
				case "max-age":
				case "maxage":
					cookie.maxAge = parseInt(attributeValue, 10);
					break;
				case "expires":
				case "rawexpires":
					// Parse date
					cookie.expiresIn = new Date(attributeValue);
					break;
				case "secure":
					cookie.secure = true;
					break;
				case "httponly":
					cookie.httpOnly = true;
					break;
				case "samesite":
					cookie.sameSite = true;
					break;
			}
		}

		return cookie ? cookie : null;
	}

	toString(): string {
		return cookieToString(this);
	}
}

export const cookieToString = (cookie: Cookie) => {
	var cookieString = `${cookie.name}=${cookie.value}; `
	if (cookie.expiresIn) {
		const date = cookie.expiresIn;
		cookieString += "expires=" + date.toUTCString() + "; ";
	}

	if (cookie.path) {
		cookieString += "path=" + cookie.path + "; ";
	}

	if (cookie.domain) {
		cookieString += "domain=" + cookie.domain + "; ";
	}

	if (cookie.secure) cookieString += "Secure; ";
	if (cookie.httpOnly) cookieString += "HttpOnly; ";
	if (cookie.sameSite) cookieString += "SameSite; ";
	return cookieString.slice(0, cookieString.length - 2);
};
