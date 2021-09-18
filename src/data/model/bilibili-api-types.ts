export interface WebInterface{
    bvid: string;
    aid: string;
    videos: number;
    tid: number;
    tname: string;
    copyright: number;
    pic: string;
    title: string;
    pubdate: number;
    ctime: number;
    desc: string;
    desc_v2: DescV2[];
    state: number;
    duration: number;
    rights: Rights;
    owner: Owner;
    stat: Stats;
    dynamic: string;
    cid: string;
    dimension: Dimension;
    no_cache: boolean;
    pages: Pages[];
    subtitle: Subtitle ;
    user_garb: UserGarb;
}

export interface DescV2 {
    raw_text: string;
    type: number;
    biz_id: number;
}

export interface Rights {
    bp: boolean;
    elec: boolean;
    download: boolean;
    movie: boolean;
    pay: boolean;
    hd5: boolean;
    no_reprint: boolean;
    autoplay: boolean;
    ugc_pay: boolean;
    is_cooperation: boolean;
    ugc_pay_preview: boolean;
    no_background: boolean;
    clean_mode: boolean;
    is_stein_gate: boolean;
}

export interface Owner {
    mid: number;
    name: string;
    face: string;
}

export interface Stats {
    aid: number;
    view: number;
    danmaku: number;
    reply: number;
    favorite: number;
    coin: number;
    share: number;
    now_rank: number;
    his_rank: number;
    like: number;
    dislike: number;
    evaluation: string;
    argue_msg: string;
}

export interface Dimension {
    width: number;
    height: number;
    rotate: number;
}

export interface Pages {
    cid: string;
    page: number;
    from: string;
    part: string;
    duration: number;
    vid: string;
    weblink: string;
    dimension: Dimension;
    first_frame: string;
}

export interface Subtitle {
    allow_submit: boolean;
    list: SubtitleEntity[];
}

export interface SubtitleEntity {
    id: string;
    lan: string;
    lan_doc: string;
    is_lock: boolean;
    subtitle_url: string;
    author: Author;
}

export interface Author {
    mid: number;
    name: string;
    sex: string;
    face: string;
    sign: string;
    rank: number;
    birthday: number;
    is_fake_account: boolean;
    is_deleted: boolean;
}

export interface UserGarb {
    url_image_ani_cut: string;
}

export interface PlayUrlData {
    from: string;
    result: string;
    message: string;
    quality: number;
    format: string;
    timelength: number;
    accept_format: string;
    accept_description: string[];
    "accept_quality": number[];
    video_codecid: number;
    seek_param: string;
    seek_type: string;
    durl: Durl[];
    support_formats: SupportFormats[];
    high_format: string;
}

export interface SupportFormats {
    quality: number;
    format: string;
    new_description: string;
    display_desc: string;
    superscript: string;
}

export interface Durl{
    order: string;
    length: number;
    size: number;
    ahead: string;
    vhead: string;
    url: string;
    backup_url: string;
}

export interface SearchResults {
    result_type: string;
    data: SearchResultData[];
}

export interface SearchResultData {
    type: string;
    id: string;
    author: string;
    mid: string;
    typeid: string;
    typename: string;
    arcurl: string;
    aid: string;
    bvid: string;
    title: string;
    description: string;
    arcrank: string;
    pic: string;
    play: number;
    video_review: number;
    favorites: number;
    tag: string;
    review: number;
    pubdate: number;
    senddate: number;
    duration: string;
    badgepay: false;
    hit_columns: string[];
    view_type: string;
    is_pay: number;
    is_union_video: number;
    rec_tags: string[];
    new_rec_tags: string[];
    rank_score: number;
    corner: string;
    cover: string;
    desc: string;
    url: string;
    rec_reason: string;
}
