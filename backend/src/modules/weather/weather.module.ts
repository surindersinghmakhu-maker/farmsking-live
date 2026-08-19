import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { AdvisorAssignmentModule } from '../advisor-assignment/advisor-assignment.module';

@Module({
  imports: [AdvisorAssignmentModule],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
