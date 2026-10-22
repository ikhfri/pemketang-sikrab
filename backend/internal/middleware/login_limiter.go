package middleware

import (
	"github.com/gin-gonic/gin"
)

type LoginLimiter struct {
	slots chan struct{}
}

func NewLoginLimiter(maxConcurrent int) *LoginLimiter {
	return &LoginLimiter{
		slots: make(chan struct{}, maxConcurrent),
	}
}

func (l *LoginLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		select {
		case l.slots <- struct{}{}:
			defer func() {
				<-l.slots
			}()

			c.Next()

		case <-c.Request.Context().Done():
			return
		}
	}
}