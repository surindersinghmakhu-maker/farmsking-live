import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user.type';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user, dto);
  }

  @Get()
  listAll(
    @CurrentUser() user?: AuthUser,
    @Query('includeInactive') includeInactive?: string,
    @Query('sellerStoreId') sellerStoreId?: string,
    @Query('slug') slug?: string,
    @Query('categorySlug') categorySlug?: string,
  ) {
    const canSeeInactive = Boolean(user && (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN || user.role === Role.SELLER) && includeInactive === 'true');
    return this.productsService.listAll(canSeeInactive, sellerStoreId, slug, categorySlug);
  }

  /** Admin: List products pending moderation review */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/pending')
  listPendingForAdmin() {
    return this.productsService.listPendingForAdmin();
  }

  /** Admin: Approve product */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/approve/:id')
  approveProductByAdmin(@Param('id') id: string) {
    return this.productsService.approveProductByAdmin(id);
  }

  /** Admin: Reject product with reason */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/reject/:id')
  rejectProductByAdmin(@Param('id') id: string, @Body('reason') reason: string) {
    return this.productsService.rejectProductByAdmin(id, reason);
  }

  /** Submit a Product Review */
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  addReview(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Body('title') title?: string,
    @Body('comment') comment?: string,
    @Body('photoUrls') photoUrls?: string[],
  ) {
    return this.productsService.addReview(user, id, rating, title, comment, photoUrls);
  }

  /** Get Product Reviews */
  @Get(':id/reviews')
  getReviews(@Param('id') id: string) {
    return this.productsService.getReviews(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}


