import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { StatisticsService } from "./statistics.service";

@Controller("statistics")
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService
  ) { }

  @Get("overview")
  getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get("indirect-dashboard")
  getIndirectDashboardStats() {
    return this.statisticsService.getIndirectDashboardStats();
  }

  @Get("admin-dashboard")
  getAdminDashboardStats() {
    return this.statisticsService.getAdminDashboardStats();
  }

  @Get("direct-dashboard")
  getDirectDashboardStats() {
    return this.statisticsService.getDirectDashboardStats();
  }

  @Get("analysis")
  getCdrGtAnalysis(
    @Query("major") major?: string,
    @Query("schoolYear") schoolYear?: string,
    @Query("semester") semester?: string,
  ) {
    return this.statisticsService.getAnalysisStats(major, schoolYear, semester);
  }

  @Get("analysis-settings")
  getAnalysisSettings() {
    return this.statisticsService.getAnalysisSettings();
  }

  @Put("analysis-settings")
  updateAnalysisSettings(@Body() body: Record<string, unknown>) {
    return this.statisticsService.updateAnalysisSettings(body);
  }
}
