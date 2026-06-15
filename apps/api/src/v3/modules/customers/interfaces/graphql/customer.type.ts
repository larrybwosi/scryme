import {ObjectType, Field, ID} from "@nestjs/graphql";

@ObjectType()
export class CustomerType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({nullable: true})
  email?: string;

  @Field()
  organizationId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
