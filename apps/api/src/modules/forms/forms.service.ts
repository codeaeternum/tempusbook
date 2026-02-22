import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormTemplateDto, UpdateFormTemplateDto, SubmitFormResponseDto } from './dto/forms.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) { }

  async createTemplate(createDto: CreateFormTemplateDto) {
    return this.prisma.formTemplate.create({
      data: {
        businessId: createDto.businessId,
        name: createDto.name,
        description: createDto.description,
        category: createDto.category || 'registro',
        isActive: createDto.isActive ?? true,
        fields: createDto.fields as unknown as Prisma.InputJsonValue,
      }
    });
  }

  async findAllTemplates(businessId: string) {
    const forms = await this.prisma.formTemplate.findMany({
      where: { businessId },
      include: {
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map `_count` to `responses` for frontend compatibility
    return forms.map(form => ({
      ...form,
      responses: form._count.responses
    }));
  }

  async findTemplateById(id: string, businessId: string) {
    const form = await this.prisma.formTemplate.findFirst({
      where: { id, businessId }
    });

    if (!form) throw new NotFoundException('Formulario no encontrado');
    return form;
  }

  async updateTemplate(id: string, businessId: string, updateDto: UpdateFormTemplateDto) {
    const existing = await this.findTemplateById(id, businessId);

    return this.prisma.formTemplate.update({
      where: { id: existing.id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        category: updateDto.category,
        isActive: updateDto.isActive,
        fields: updateDto.fields ? (updateDto.fields as unknown as Prisma.InputJsonValue) : undefined,
      }
    });
  }

  async deleteTemplate(id: string, businessId: string) {
    const existing = await this.findTemplateById(id, businessId);

    return this.prisma.formTemplate.delete({
      where: { id: existing.id }
    });
  }

  // ==========================================
  // RESPONSES
  // ==========================================

  async submitResponse(submitDto: SubmitFormResponseDto, formId: string) {
    // Validate form exists
    const form = await this.findTemplateById(formId, submitDto.businessId);

    const response = await this.prisma.formResponse.create({
      data: {
        businessId: submitDto.businessId,
        formId: formId,
        clientId: submitDto.clientId,
        responseData: submitDto.responseData as unknown as Prisma.InputJsonValue
      }
    });

    // --- SINERGIA #8: EHR Auto-fill ---
    // Extract key indicators like blood type, allergies if form is health-related
    if (form.category === 'salud' || form.category === 'medico' || form.category === 'intake') {
      if (submitDto.clientId) {
        const data = submitDto.responseData as Record<string, any>;

        const bloodType = data['bloodType'] || data['tipo_sangre'] || data['tipoSangre'];
        const allergies = data['allergies'] || data['alergias'];
        const chronicConditions = data['chronicConditions'] || data['condiciones_cronicas'] || data['enfermedades'];
        const currentMedications = data['currentMedications'] || data['medicamentos'] || data['current_medications'];
        const emergencyContact = data['emergencyContact'] || data['contacto_emergencia'] || data['emergency_contact'];

        if (bloodType || allergies || chronicConditions || currentMedications || emergencyContact) {
          await this.prisma.medicalRecord.upsert({
            where: {
              businessId_clientId: {
                businessId: submitDto.businessId,
                clientId: submitDto.clientId
              }
            },
            create: {
              businessId: submitDto.businessId,
              clientId: submitDto.clientId,
              bloodType: bloodType ? String(bloodType) : undefined,
              allergies: allergies ? String(allergies) : undefined,
              chronicConditions: chronicConditions ? String(chronicConditions) : undefined,
              currentMedications: currentMedications ? String(currentMedications) : undefined,
              emergencyContact: emergencyContact ? String(emergencyContact) : undefined
            },
            update: {
              ...(bloodType && { bloodType: String(bloodType) }),
              ...(allergies && { allergies: String(allergies) }),
              ...(chronicConditions && { chronicConditions: String(chronicConditions) }),
              ...(currentMedications && { currentMedications: String(currentMedications) }),
              ...(emergencyContact && { emergencyContact: String(emergencyContact) })
            }
          });
        }
      }
    }

    return response;
  }

  async getFormResponses(formId: string, businessId: string) {
    await this.findTemplateById(formId, businessId);

    return this.prisma.formResponse.findMany({
      where: { formId, businessId },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
  }
}
