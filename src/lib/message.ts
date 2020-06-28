export type Data = unknown;
export type Attributes = Record<string, string | string[] | undefined>;

export interface Request<TData = Data, TAttributes = Attributes, TOriginalRequest = any> {
    id: string;
    data: TData;
    attributes: TAttributes;
    originalRequest: TOriginalRequest;
}

export type PlainResponse = Data | void;
export type FullResponse<TData = unknown, TAttributes = Attributes> = { data: TData; attributes: TAttributes };
export type Response<TData = unknown, TAttributes = Attributes> = TData | FullResponse<TData, TAttributes>;
