import { Test, TestingModule } from '@nestjs/testing';
import { SlackProvider } from '../slack.provider';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('axios');

describe('SlackProvider', () => {
  let provider: SlackProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SlackProvider],
    }).compile();

    provider = module.get<SlackProvider>(SlackProvider);
  });

  it('should include timeout and maxContentLength in oauth request', async () => {
    const mockResponse = { data: { ok: true, access_token: 'test-token' } };
    (axios.post as any).mockResolvedValue(mockResponse);

    await provider.handleCallback('test-code');

    expect(axios.post).toHaveBeenCalledWith(
      'https://slack.com/api/oauth.v2.access',
      null,
      expect.objectContaining({
        timeout: 10000,
        maxContentLength: 1048576,
      })
    );
  });

  it('should include timeout and maxContentLength in sendMessage request', async () => {
    const mockResponse = { data: { ok: true, ts: '123', message: { ts: '123' } } };
    (axios.post as any).mockResolvedValue(mockResponse);

    await provider.sendMessage(
      { credentials: { accessToken: 'token' } } as any,
      { text: 'hello', channelId: 'C1' }
    );

    expect(axios.post).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      expect.any(Object),
      expect.objectContaining({
        timeout: 10000,
        maxContentLength: 1048576,
      })
    );
  });

  it('should include timeout and maxContentLength in getUserEmail request', async () => {
    const mockResponse = { data: { ok: true, user: { profile: { email: 'test@example.com' } } } };
    (axios.get as any).mockResolvedValue(mockResponse);

    await provider.getUserEmail(
      { credentials: { accessToken: 'token' } } as any,
      'U1'
    );

    expect(axios.get).toHaveBeenCalledWith(
      'https://slack.com/api/users.info',
      expect.objectContaining({
        timeout: 10000,
        maxContentLength: 1048576,
      })
    );
  });
});
