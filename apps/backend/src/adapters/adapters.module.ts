import { Module } from '@nestjs/common';
import { MockAdapter } from './mock.adapter';

@Module({
    providers: [MockAdapter],
    exports: [MockAdapter],
})
export class AdaptersModule { }
