// import { Request, Response, NextFunction } from "express";
// import { verifyToken } from "../utils/jwt";

// declare global {
//   namespace Express {
//     interface Request {
//       user?: any;
//     }
//   }
// }

// export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
//   // ตรวจสอบ Token ใน Header
//   const token = req.cookies.token;
//   // console.log(token);

//   if (token) {
//     // const decoded = verifyToken(token);
//     const decoded = verifyToken(token) as { userId: string; role: string; iat: number; exp: number };
//     // console.log(decoded.role);
//     if(!decoded){
//       res.status(403).json({ message: "Invalid or expired token" }); // Forbidden
//       return ;
//     }
//       // เก็บข้อมูลผู้ใช้ไว้ใน Request
//       req.user = decoded;
//       // console.log(req.user);

//       next();

//   } else {
//     res.status(401).json({ message: "Authorization token missing" }); // Unauthorized
//   }
// };

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { UserRepository } from "@modules/user/userRepository";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // ตรวจสอบ Token ใน Header
  const token = req.cookies.token;

  if (token) {
    const decoded = verifyToken(token) as {
      userId: string;
      role: string;
      iat: number;
      exp: number;
    };

    if (!decoded) {
      res.status(403).json({ message: "Invalid or expired token" }); // Forbidden
      return;
    }

    // ตรวจสอบว่าผู้ใช้ยังมีอยู่ในระบบหรือไม่
    try {
  const user = await UserRepository.findById(decoded.userId);
  
  if (!user) {
    // ลบ token ถ้าไม่พบผู้ใช้
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    res.status(403).json({ message: "User not found" });
    return;
  }
  
  // ตรวจสอบสถานะการใช้งาน
  if (user.is_active === false) {
    // ลบ token ถ้าผู้ใช้ถูกระงับสิทธิ์
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    res.status(403).json({ message: "Your account has been suspended" });
    return;
  }
  
  // เก็บข้อมูลผู้ใช้ไว้ใน Request
  req.user = decoded;
  next();
    } catch (error) {
      console.error("Error verifying user status:", error);
      res
        .status(500)
        .json({ message: "Internal server error during authentication" });
    }
  } else {
    res.status(401).json({ message: "Authorization token missing" }); // Unauthorized
  }
};
