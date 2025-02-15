declare module 'github-api' {
  declare class GitHub {
    constructor(options?: GitHubOptions);
    options: GitHubOptions;
    request(method: HttpMethod, path: string, options?: RequestOptions): Promise<Response>;
    get(path: string, options?: RequestOptions): Promise<Response>;
    delete(path: string, options?: RequestOptions): Promise<Response>;
    patch(path: string, options?: RequestOptions): Promise<Response>;
    post(path: string, options?: RequestOptions): Promise<Response>;
    put(path: string, options?: RequestOptions): Promise<Response>;
    paged(path: string, options?: RequestOptions, next?: (err: Error | null, res?: Response) => void): Promise<PagedResponse>;
  }

  interface GitHubOptions {
    token?: string;
    username?: string;
    password?: string;
    headers?: Record<string, string>;
    [key: string]: string | Record<string, string> | undefined;
  }

  type ResponseBody = Record<string, unknown>;

  interface RequestOptions {
    headers?: Record<string, string>;
    body?: ResponseBody;
    [key: string]: string | Record<string, string> | undefined;
  }

  interface Response {
    body: ResponseBody;
    headers: Record<string, string>;
    statusCode: number;
  }

  interface PagedResponse extends Response {
    pages: Response[];
  }

  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  export = GitHub;
}
