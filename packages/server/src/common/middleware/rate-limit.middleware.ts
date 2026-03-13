import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as rateLimit from 'express-rate-limit';
import { Logger } from '@nestjs/common';

const logger = new Logger('RateLimiting');

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
        res.status(429).json({
            statusCode: 429,
            message: 'Too many requests, please try again later',
            retryAfter: req.rateLimit?.resetTime,
        });
    },
    skip: (req) => {
        // Skip rate limiting for test/development
        return process.env.NODE_ENV === 'test';
    },
});

// General rate limiting for API endpoints
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
        res.status(429).json({
            statusCode: 429,
            message: 'Too many requests, please try again later',
        });
    },
});

// Strict rate limiting for password reset
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 resets per hour per IP
    message: 'Too many password reset attempts',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Password reset rate limit exceeded for ${req.ip}`);
        res.status(429).json({
            statusCode: 429,
            message: 'Too many password reset attempts. Please try again in 1 hour.',
        });
    },
});

// Data export rate limiting (prevent abuse)
export const dataExportLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 1, // 1 export per 24 hours
    message: 'Too many data export requests',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Data export rate limit exceeded for user ${req.user?.id}`);
        res.status(429).json({
            statusCode: 429,
            message: 'Only one data export allowed per 24 hours',
        });
    },
});

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Add rate limit info to headers
        if (req.rateLimit) {
            res.setHeader('X-RateLimit-Limit', req.rateLimit.limit);
            res.setHeader('X-RateLimit-Remaining', req.rateLimit.current);
            res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime);
        }
        next();
    }
}
