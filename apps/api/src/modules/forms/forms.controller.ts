import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormTemplateDto, UpdateFormTemplateDto, SubmitFormResponseDto } from './dto/forms.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(FirebaseAuthGuard)
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) { }

  @Post()
  async createTemplate(
    @Body() createDto: CreateFormTemplateDto,
    @CurrentUser() user: any
  ) {
    // Enforce the businessId matches the authenticated user's context if needed
    return this.formsService.createTemplate(createDto);
  }

  @Get()
  async findAllTemplates(@Query('businessId') businessId: string) {
    return this.formsService.findAllTemplates(businessId);
  }

  @Get(':id')
  async findOneTemplate(
    @Param('id') id: string,
    @Query('businessId') businessId: string
  ) {
    return this.formsService.findTemplateById(id, businessId);
  }

  @Patch(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Query('businessId') businessId: string,
    @Body() updateDto: UpdateFormTemplateDto
  ) {
    return this.formsService.updateTemplate(id, businessId, updateDto);
  }

  @Delete(':id')
  async deleteTemplate(
    @Param('id') id: string,
    @Query('businessId') businessId: string
  ) {
    return this.formsService.deleteTemplate(id, businessId);
  }

  // ==========================================
  // RESPONSES Endpoints
  // ==========================================

  @Post(':id/responses')
  async submitResponse(
    @Param('id') formId: string,
    @Body() submitDto: SubmitFormResponseDto
  ) {
    return this.formsService.submitResponse(submitDto, formId);
  }

  @Get(':id/responses')
  async getResponses(
    @Param('id') formId: string,
    @Query('businessId') businessId: string
  ) {
    return this.formsService.getFormResponses(formId, businessId);
  }
}
