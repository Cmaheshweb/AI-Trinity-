import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource from '../../ormconfig'; // Using the external DataSource

@Module({
  imports: [
    // This module can be used to export specific repositories if needed for other modules
    // For now, the main connection is handled in AppModule.
  ],
  providers: [],
  exports: [],
})
export class DatabaseModule {}