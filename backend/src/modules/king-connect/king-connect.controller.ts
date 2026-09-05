import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KingConnectService } from './king-connect.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { SendConnectRequestDto } from './dto/send-connect-request.dto';
import { RespondConnectDto } from './dto/respond-connect.dto';
import { CreateSyncRequestDto } from './dto/create-sync-request.dto';
import { RespondSyncRequestDto } from './dto/respond-sync-request.dto';
import { CreateDemandRequestDto } from './dto/create-demand-request.dto';
import { RespondDemandRequestDto } from './dto/respond-demand-request.dto';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { RespondPaymentRequestDto } from './dto/respond-payment-request.dto';


@UseGuards(JwtAuthGuard)
@Controller('king-connect')
export class KingConnectController {
  constructor(private readonly service: KingConnectService) {}

  // ─── Connection Management ─────────────────────────────────────────────────

  /** Send a King Connect request to another user by King ID or mobile */
  @Post('connect')
  sendConnectRequest(@CurrentUser() user: AuthUser, @Body() dto: SendConnectRequestDto) {
    return this.service.sendConnectRequest(user, dto);
  }

  /** Get all incoming pending connection requests */
  @Get('connect/pending')
  listPendingConnections(@CurrentUser() user: AuthUser) {
    return this.service.listPendingConnectionRequests(user);
  }

  /** Accept or decline a connection request */
  @Patch('connect/:id/respond')
  respondToConnect(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RespondConnectDto,
  ) {
    return this.service.respondToConnect(user, id, dto);
  }

  /** List all accepted connections */
  @Get('connections')
  listConnections(@CurrentUser() user: AuthUser) {
    return this.service.listMyConnections(user);
  }

  /** Toggle auto-accept for a connection */
  @Patch('connections/:id/auto-accept')
  toggleAutoAccept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.toggleAutoAccept(user, id);
  }

  // ─── P2P Ledger Sync ───────────────────────────────────────────────────────

  /** Create a sync request (send your transaction to connected user) */
  @Post('sync')
  createSyncRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateSyncRequestDto) {
    return this.service.createSyncRequest(user, dto);
  }

  /** Get pending sync requests (incoming, waiting for my action) */
  @Get('sync/pending')
  listPendingSync(@CurrentUser() user: AuthUser) {
    return this.service.listPendingSyncRequests(user);
  }

  /** Get sync history (accepted / rejected / expired) */
  @Get('sync/history')
  listSyncHistory(@CurrentUser() user: AuthUser) {
    return this.service.listSyncHistory(user);
  }

  /** Accept, reject, or counter-propose a sync request */
  @Patch('sync/:id/respond')
  respondToSync(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RespondSyncRequestDto,
  ) {
    return this.service.respondToSyncRequest(user, id, dto);
  }

  // ─── Demand Request System ─────────────────────────────────────────────────

  /** Shopkeeper/Customer creates a product demand to a connected Farmer */
  @Post('demands')
  createDemand(@CurrentUser() user: AuthUser, @Body() dto: CreateDemandRequestDto) {
    return this.service.createDemandRequest(user, dto);
  }

  /** List demands (incoming = farmer side, outgoing = requester side) */
  @Get('demands')
  listDemands(@CurrentUser() user: AuthUser, @Query('type') type: 'incoming' | 'outgoing' = 'incoming') {
    return this.service.listDemands(user, type);
  }

  /** Farmer responds to a product demand (accept / partial / reject) */
  @Patch('demands/:id/respond')
  respondToDemand(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RespondDemandRequestDto,
  ) {
    return this.service.respondToDemand(user, id, dto);
  }

  // ─── Payment Request System ────────────────────────────────────────────────

  /** Send a payment request to a connected user */
  @Post('payment-requests')
  createPaymentRequest(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentRequestDto) {
    return this.service.createPaymentRequest(user, dto);
  }

  /** List payment requests */
  @Get('payment-requests')
  listPaymentRequests(@CurrentUser() user: AuthUser, @Query('type') type: 'incoming' | 'outgoing' = 'incoming') {
    return this.service.listPaymentRequests(user, type);
  }

  /** Respond to a payment request (accept / partial / postpone / reject) */
  @Patch('payment-requests/:id/respond')
  respondToPaymentRequest(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RespondPaymentRequestDto,
  ) {
    return this.service.respondToPaymentRequest(user, id, dto);
  }

  // ─── Activity Feed & Shared Ledger ─────────────────────────────────────────

  /** Full chronological activity feed for this user */
  @Get('activity')
  getActivity(@CurrentUser() user: AuthUser) {
    return this.service.getActivityFeed(user);
  }

  /** Shared verified ledger data for a specific connection */
  @Get('shared-ledger/:linkId')
  getSharedLedger(@CurrentUser() user: AuthUser, @Param('linkId') linkId: string) {
    return this.service.getSharedLedger(user, linkId);
  }

  /** Manually expire stale requests (can also be cron-triggered) */
  @Post('admin/expire-stale')
  expireStale() {
    return this.service.expireStaleRequests();
  }
}
