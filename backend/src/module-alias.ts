import moduleAlias from 'module-alias';
import path from 'path';

// Resolve aliases dynamically for both dev (src) and production (dist)
const rootDir = __dirname;

moduleAlias.addAliases({
  '@': rootDir,
  '@/shared': path.join(rootDir, 'shared'),
  '@/modules': path.join(rootDir, 'modules'),
});
