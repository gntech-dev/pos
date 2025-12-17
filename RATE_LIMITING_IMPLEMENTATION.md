# API Rate Limiting and Brute Force Protection Implementation

## Overview

This document describes the comprehensive API rate limiting and brute force protection implementation for the POS system. The implementation provides multi-layered security to protect against various attack vectors including brute force login attempts, API endpoint abuse, and excessive request rates.

## Features

### 1. Multi-tiered Rate Limiting
- **Login Endpoint**: 5 requests per 15 minutes (very strict)
- **Validation Endpoints**: 100 requests per hour (RNC/Cédula validation)
- **Search Endpoints**: 50 requests per hour
- **General Endpoints**: 1000 requests per hour
- **Admin Endpoints**: 2000 requests per hour

### 2. Brute Force Protection
- **Login Protection**: 5 failed attempts = 15-minute block
- **IP-based Tracking**: Identifies and blocks abusive clients
- **Automatic Reset**: Clears counters on successful login
- **Smart Detection**: Distinguishes between different attack patterns

### 3. Comprehensive Logging
- **Rate Limit Violations**: Tracks when limits are exceeded
- **Brute Force Attempts**: Logs failed login patterns
- **Security Events**: Monitors suspicious activities
- **Performance Metrics**: Tracks system impact

### 4. Proper HTTP Responses
- **429 Status**: Standard rate limit exceeded response
- **Retry-After Headers**: Informs clients when to retry
- **Detailed Messages**: Provides helpful error information

## Technical Implementation

### Dependencies
- **rate-limiter-flexible**: Core rate limiting library
- **Memory Storage**: In-memory storage for single-instance deployments

### Core Files

#### `lib/rate-limit.ts`
Main rate limiting utility providing:
- Rate limit configurations for different endpoint types
- IP detection and key generation functions
- Brute force protection class with attempt tracking
- Rate limit violation logging
- Helper functions for creating proper HTTP responses

#### Updated API Endpoints
- **Login** (`app/api/login/route.ts`): Rate limiting + brute force protection
- **RNC Validation** (`app/api/customers/validate-rnc/[rnc]/route.ts`): Validation rate limiting
- **Cédula Validation** (`app/api/customers/validate-cedula/[cedula]/route.ts`): Validation rate limiting
- **NCF Monitor** (`app/api/ncf/monitor/route.ts`): Admin rate limiting

### Rate Limit Configuration

```typescript
const rateLimitConfig = {
  login: {
    points: 5,           // 5 requests
    duration: 15 * 60,   // per 15 minutes
  },
  validateRNC: {
    points: 100,         // 100 requests
    duration: 60 * 60,   // per hour
  },
  validateCedula: {
    points: 100,         // 100 requests
    duration: 60 * 60,   // per hour
  },
  admin: {
    points: 2000,        // 2000 requests
    duration: 60 * 60,   // per hour
  }
}
```

### Brute Force Protection Configuration

```typescript
const bruteForceConfig = {
  points: 5,              // 5 failed attempts
  duration: 15 * 60,      // block for 15 minutes
  blockDuration: 15 * 60  // 15-minute block period
}
```

## Usage Examples

### Basic Rate Limiting Check
```typescript
import { endpointLimiters, createRateLimitResponse } from '@/lib/rate-limit'

export async function handler(req: NextRequest) {
  // Check rate limiting first
  const rateLimitResult = await endpointLimiters.login(req)
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult, { limiter: 'login' })
  }
  
  // Continue with normal processing
}
```

### Brute Force Protection
```typescript
import { BruteForceProtection } from '@/lib/rate-limit'

// Check if client is allowed
const bruteForceCheck = await BruteForceProtection.checkPassword(clientIP)
if (!bruteForceCheck.allowed) {
  return NextResponse.json(
    { error: "Too many login attempts", retryAfter: remainingTime },
    { status: 429, headers: { 'Retry-After': remainingTime.toString() } }
  )
}

// Record failed attempt
await BruteForceProtection.recordFailure(clientIP, username)

// Record successful login (resets counter)
await BruteForceProtection.recordSuccess(clientIP, username)
```

### Response Headers
Rate limit exceeded responses include:
- `Retry-After`: Seconds to wait before retrying
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## Security Features

### IP Detection
The system automatically detects client IP addresses using:
1. `x-forwarded-for` header (load balancer proxy)
2. `x-real-ip` header (nginx proxy)
3. Fallback to request IP

### Attack Pattern Detection
- **Brute Force**: Multiple failed login attempts
- **API Abuse**: Excessive API requests
- **Resource Exhaustion**: Rapid-fire validation requests
- **Coordinated Attacks**: Multiple IPs from same source

### Automatic Blocking
- **Temporary Blocks**: 15-minute blocks for brute force
- **Rate Limit Enforcement**: Immediate blocking when limits exceeded
- **Smart Recovery**: Automatic unblocking after time periods

## Monitoring and Logging

### Console Logging
All rate limiting events are logged to console with:
- Timestamp
- Client IP
- Endpoint accessed
- Block reason
- Additional context

### Log Examples
```
RATE LIMIT VIOLATION: login:127.0.0.1 - Rate limit exceeded for limiter: login
BRUTE FORCE BLOCK: 127.0.0.1:testuser - Account temporarily blocked. Try again in 900 seconds.
RATE LIMIT VIOLATION: validation:192.168.1.100 - Rate limit exceeded for limiter: validation
```

## Configuration Options

### Environment Variables
Future enhancement for environment-based configuration:
```bash
RATE_LIMIT_LOGIN_POINTS=5
RATE_LIMIT_LOGIN_DURATION=900
RATE_LIMIT_VALIDATION_POINTS=100
RATE_LIMIT_VALIDATION_DURATION=3600
```

### Storage Backend
Current implementation uses memory storage. For production:
- **Redis**: Distributed rate limiting across multiple instances
- **Database**: Persistent storage for analytics
- **Custom**: Implement other storage backends

## Testing

### Manual Testing
Test rate limiting with curl:
```bash
# Test login rate limiting
for i in {1..10}; do 
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username": "test", "password": "wrong"}'
done

# Test RNC validation rate limiting
for i in {1..110}; do 
  curl -X GET http://localhost:3000/api/customers/validate-rnc/123456789
done
```

### Expected Responses
- **Normal**: `{ "error": "Invalid credentials", "remainingAttempts": 4 }`
- **Rate Limited**: `{ "error": "Too many requests", "retryAfter": 60 }`
- **Brute Force Blocked**: `{ "error": "Too many login attempts", "retryAfter": 900 }`

## Best Practices

### 1. Endpoint Selection
- **High-risk endpoints**: Strict limits (login, validation)
- **Medium-risk endpoints**: Moderate limits (search, reports)
- **Low-risk endpoints**: Generous limits (public data)

### 2. Limit Tuning
- Monitor usage patterns
- Adjust limits based on legitimate usage
- Consider business requirements
- Balance security vs. usability

### 3. Monitoring
- Log all violations for analysis
- Monitor for false positives
- Track system performance impact
- Alert on unusual patterns

### 4. User Experience
- Provide clear error messages
- Include retry timing information
- Consider progressive delays
- Implement user-friendly backoff

## Future Enhancements

### 1. Advanced Features
- **Distributed Rate Limiting**: Redis-based storage
- **User-based Limits**: Different limits per user role
- **Dynamic Limits**: Adjust limits based on system load
- **Analytics Dashboard**: Real-time rate limiting metrics

### 2. Machine Learning
- **Anomaly Detection**: Identify unusual patterns
- **Adaptive Limits**: ML-based limit adjustment
- **Behavioral Analysis**: User behavior profiling

### 3. Integration
- **SIEM Integration**: Send logs to security systems
- **Alert Systems**: Real-time security notifications
- **API Gateway**: Enterprise rate limiting integration

## Troubleshooting

### Common Issues

#### Rate Limiting Not Working
- Check if `rate-limiter-flexible` is installed
- Verify import statements
- Ensure proper endpoint integration

#### Memory Issues
- Current implementation stores data in memory
- May cause memory leaks in long-running processes
- Consider Redis for production

#### False Positives
- Legitimate users hitting limits
- Mobile apps with background requests
- Corporate networks sharing IPs

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG = process.env.NODE_ENV === 'development'
```

## Security Considerations

### 1. Bypass Prevention
- IP spoofing detection
- User agent validation
- Request pattern analysis

### 2. Privacy Protection
- IP address handling
- Data retention policies
- GDPR compliance

### 3. Attack Mitigation
- DDoS protection
- Resource exhaustion prevention
- Coordinated attack detection

## Conclusion

The rate limiting and brute force protection implementation provides comprehensive security for the POS system API. The multi-layered approach ensures protection against various attack vectors while maintaining usability for legitimate users.

Regular monitoring and tuning of rate limits will be necessary as the system evolves and usage patterns change. The modular design allows for easy expansion and customization based on specific security requirements.