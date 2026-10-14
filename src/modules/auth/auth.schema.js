import { z } from 'zod';

// Valida el body de registro y login, y genera la documentación Swagger.
// El pipe a z.email() hace que se pierda el formato en el JSON Schema, por eso se agrega con .meta().
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()).meta({ format: 'email', example: 'ana@test.com' }),
  password: z.string().min(8).max(72).meta({ example: 'supersecreta' }),
});
