
export interface IString {
   [key: string]: string,
}

export interface INumber {
   [key: string]: number,
}

export interface IBoolean {
   [key: string]: boolean,
}

export interface ILogin {
   userName:      string,
   password:      string,
}

export interface ISignin extends ILogin {
   verifyUserName: string,
   verifyPassword: string,
}

export interface IEntity {
   userID:     number,
   playerName: string,
}

export interface IAuthSocket {
   playerName:  string,
   playerToken: string,
   userToken:   string,
}