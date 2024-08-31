import MongoDB from "../db/service.js";
import {getLogger, Logger} from "../../utils/logger.js";
import { Schema } from "mongoose";
import { BiliApiSessionDoc } from "../db/schemas/bili-api-session.js";
import { Cookie } from "../../utils/cookie.js";
import { CommandException } from "../../commands/base-command.js";

export class BiliApiSessionDataSource {
    private static instance: BiliApiSessionDataSource;
    public static getInstance(): BiliApiSessionDataSource {
        if (!BiliApiSessionDataSource.instance) {
            if (!MongoDB.isConnected()) {
                throw new Error('Mongo DB is not connected');
            }
            BiliApiSessionDataSource.instance = new BiliApiSessionDataSource();
        }
        return BiliApiSessionDataSource.instance;
    }

    protected readonly logger: Logger;

    private constructor() {
        this.logger = getLogger('BiliApiSessionDataSource');
    }

    public async load(): Promise<BiliApiSessionDoc[]> {
        this.logger.verbose(`Querying all BiliApiSession`);
        return MongoDB.BiliApiSession.find({});
    }

    public async exists(_id?: Number): Promise<Boolean> {
        return MongoDB.BiliApiSession.exists({_id: _id}) != null;
    }

    public async getOne(_id?: Number): Promise<BiliApiSessionDoc> {
        this.logger.verbose(`Querying Bili Api Session with id=${_id}`);
        return MongoDB.BiliApiSession.findOne({_id: _id});
    }

    public async getCookieOf(_id?: Number): Promise<Cookie[]> {
        this.logger.verbose(`Querying cookie of Bili Api Session with id=${_id}`);
        const session = await MongoDB.BiliApiSession.findOne({_id: _id}, 'cookies').exec();

        if (!session) return [];

        return session.cookies;

    }

    public async isExpired(_id?: Number): Promise<Boolean> {
        this.logger.verbose(`Query the expiry status of session with id=${_id}`);
        
        // Expired = current > (updatedAt + 1 day)
        const session = await MongoDB.BiliApiSession.findOne({_id: _id}).exec();

        if (!session) throw new CommandException(false, `Bili Api Session of id ${_id} not found!`);

        const lastUpdated = (new Date(session.updatedAt));
        // Add one day to set the date to the expected expiry date
        lastUpdated.setDate(lastUpdated.getDate() + 1);
        
        return lastUpdated < (new Date());
    }

    public async insertSession(_id: Number, cookies: Cookie[]): Promise<BiliApiSessionDoc> {
        this.logger.verbose(`Inserting a new Bili Api Session`);

        const session = await new MongoDB.BiliApiSession({
            _id: _id,
            cookies: cookies,
            updatedAt: (new Date())
        }).save();

        if (!session) throw new CommandException(false, `Failed to save session ${_id}`);

        return session;
    }

    public async updateCookies(_id: Number, cookies: Cookie[]): Promise<BiliApiSessionDoc> {
        this.logger.verbose(`Updating cookies for Bili Api Session ${_id}`);
        const updatedSession = await MongoDB.BiliApiSession.findOneAndUpdate(
            {
                _id: _id
            }, {
                $set: {"cookies": cookies, "updatedAt": (new Date())}
            }, {
                new: true
            }
        );

        if (!updatedSession) throw new CommandException(false, `Failed to update session ${_id}`);

        return updatedSession;

    }
}
