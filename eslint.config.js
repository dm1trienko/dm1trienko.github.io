import { createRequire } from 'module'
import { FlatCompat } from '@eslint/eslintrc'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({ baseDirectory: __dirname })

export default [...compat.config(require('./.eslintrc.json'))]
