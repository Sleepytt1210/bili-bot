import { Document, Schema, SchemaType } from "mongoose";
import { Cookie } from "../../../utils/cookie.js";

const biliApiSessionSchema = new Schema<BiliApiSessionDoc>(
	{
		_id: { type: Number, required: true },
		cookies: {
			type: [
				{
					name: { type: Schema.Types.String, required: true },
					value: { type: Schema.Types.String, required: true },
					maxAge: { type: Schema.Types.Number, required: false},
					expiresIn: { type: Schema.Types.Date, required: false},
					path: { type: Schema.Types.String, required: false },
					domain: { type: Schema.Types.String, required: false },
					secure: { type: Schema.Types.Boolean, required: false },
					httpOnly: { type: Schema.Types.Boolean, required: false },
					sameSite: { type: Schema.Types.Boolean, required: false },
				},
			],
			required: true,
		},
		createdAt: {
			type: Date,
			required: true,
			default: Date.now
		},
		updatedAt: {
			type: Date,
			requried: true,
			default: Date.now
		},
	},
	{
		writeConcern: {
			w: "majority",
			j: true,
			wtimeout: 1000,
		},
	}
);

export interface BiliApiSessionDoc extends Document {
	_id: Number;
	cookies: Cookie[];
	createdAt: Date;
	updatedAt: Date;
}
export const BiliApiSessionSchema = biliApiSessionSchema;
