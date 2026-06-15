import {ObjectType, Field, ID, InputType} from "@nestjs/graphql";

@ObjectType()
export class ProductType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({nullable: true})
  description?: string;

  @Field()
  organizationId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field({nullable: true})
  description?: string;
}
