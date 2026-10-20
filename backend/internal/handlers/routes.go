package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"voting-angkatan/backend/internal/config"
	"voting-angkatan/backend/internal/middleware"
)

func RegisterRoutes(router *gin.Engine, pool *pgxpool.Pool, cfg config.Config) {
	router.GET("/health", health)
	router.GET("/ready", readiness(pool))

	api := router.Group("/api/v1")
	auth := api.Group("/auth")
	auth.POST("/login", login(pool, cfg))
	auth.GET("/me", me(pool, cfg))
	auth.POST("/logout", logout(pool, cfg))

	protected := api.Group("")
	protected.Use(middleware.RequireSession(pool, cfg))
	protected.GET("/candidates", listCandidates(pool))
	protected.POST("/votes", submitVote(pool, cfg))
	registerAdminRoutes(api, pool, cfg)
}
