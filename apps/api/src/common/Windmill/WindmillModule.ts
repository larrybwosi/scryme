import { Module, Global } from "@nestjs/common";

@Global()
@Module({
  providers: [
    {
      provide: "WINDMILL_SERVICE",
      useValue: {},
    },
  ],
  exports: ["WINDMILL_SERVICE"],
})
export class WindmillModule {}
