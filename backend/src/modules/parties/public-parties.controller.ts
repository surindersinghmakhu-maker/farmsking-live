import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PartiesService } from './parties.service';
import { LookupBuyerStatementDto } from './dto/lookup-buyer-statement.dto';

/**
 * Public Controller for Party Statements & Khata Lookup.
 * Exposes unauthenticated, rate-limited endpoints for crop purchasers,
 * grain traders, and shopkeepers to verify accounts with farmers.
 */
@ApiTags('Public - Parties & Khata')
@Controller('parties/public')
export class PublicPartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  /**
   * Guest Statement Lookup endpoint.
   * Enables a buyer/trader to view all bills, advances, and ledger transactions
   * recorded against their mobile number by a specific farmer.
   *
   * @param dto - Object containing buyer's mobile and farmer's mobile or King ID
   * @returns Detailed statement payload including farmer profile, entries, and net balance
   * @throws NotFoundException if the farmer account does not exist
   * @throws BadRequestException if the parameters fail validation
   */
  @ApiOperation({
    summary: 'Lookup buyer statement with a specific farmer',
    description:
      'Allows a crop buyer or shopkeeper to view their khata ledger and bills recorded by a farmer by providing their own mobile number and the farmer mobile/King ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statement successfully retrieved or clean empty report returned.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input parameters or malformed mobile number.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Farmer account not found with the provided mobile number or King ID.',
  })
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('lookup-statement')
  lookupStatement(@Body() dto: LookupBuyerStatementDto) {
    return this.partiesService.lookupBuyerStatement(dto.buyerMobile, dto.farmerMobileOrKingId);
  }
}
