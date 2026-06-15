import {ObjectType, Field, ID, Float} from "@nestjs/graphql";

@ObjectType()
export class InventoryItemType {
  @Field(() => ID)
  id: string;

  @Field()
  productId: string;

  @Field()
  locationId: string;

  @Field(() => Float)
  quantity: number;

  @Field()
  organizationId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
