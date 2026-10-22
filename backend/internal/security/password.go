package security

import "github.com/alexedwards/argon2id"

var PasswordParams = &argon2id.Params{
    Memory:      19 * 1024,
    Iterations:  2,
    Parallelism: 1,
    SaltLength:  16,
    KeyLength:   32,
}