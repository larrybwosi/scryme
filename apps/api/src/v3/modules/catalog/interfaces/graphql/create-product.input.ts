import { InputType, Field } from "@nestjs/graphql";

@InputType()
export class CreateProductInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  orgSlug: string;
}
