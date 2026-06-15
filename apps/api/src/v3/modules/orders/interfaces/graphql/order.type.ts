import {ObjectType, Field, ID, Float} from "@nestjs/graphql";

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field({nullable: true})
  customerId?: string;

  @Field()
  status: string;

  @Field(() => Float)
  totalAmount: number;

  @Field()
  organizationId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
