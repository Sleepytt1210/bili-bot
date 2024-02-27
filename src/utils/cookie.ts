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
        sameSite?: boolean,
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
		let expirationDays = -1; // Default value for session cookies

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
		const date = this.expiresIn;
		const expires = "expires=" + date.toUTCString();
		var cookieString = `${this.name}=${this.value};${expires};path=/;`;
		if (this.domain) {
			cookieString += "domain=" + this.domain;
		}
		if (this.secure) cookieString += "secure;";
		if (this.httpOnly) cookieString += "HttpOnly;";
		return cookieString;
	}
}
