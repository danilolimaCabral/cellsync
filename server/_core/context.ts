import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Tentar obter o token do cookie
  const token = opts.req.cookies?.[COOKIE_NAME];
  
  if (token) {
    try {
      // Verificar e decodificar o JWT
      const secret = new TextEncoder().encode(ENV.cookieSecret);
      const { payload } = await jwtVerify(token, secret);
      
      if (payload.userId && typeof payload.userId === "number") {
        // Carregar usuário do banco de dados
        const dbUser = await db.getUserById(payload.userId);
        
        if (dbUser && dbUser.active) {
          user = dbUser;
        }
      }
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
