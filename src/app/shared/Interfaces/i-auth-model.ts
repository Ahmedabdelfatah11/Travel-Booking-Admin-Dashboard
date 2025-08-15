export interface AuthModel {
    message: string;
    isAuthenticated: boolean;
    username?: string;
    email?: string;
    token?: string;
    expireOn?: Date;
    roles?: string[];
}
