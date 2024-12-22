package utils

import "github.com/golang-jwt/jwt"

type JwtCustomClaims struct {
	jwt.StandardClaims
	Address string `json:"address"`
	IsAdmin bool   `json:"is_admin"`
}
