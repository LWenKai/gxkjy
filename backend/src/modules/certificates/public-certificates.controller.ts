import { Controller, Get, Param } from '@nestjs/common';
import { CertificatesService } from './certificates.service';

@Controller('public/certificates')
export class PublicCertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get(':publicToken')
  getByPublicToken(@Param('publicToken') publicToken: string) {
    return this.certificatesService.getPublicCertificate(publicToken);
  }
}
