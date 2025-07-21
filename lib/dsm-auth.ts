interface DSMConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean;
}

interface AuthResponse {
  success: boolean;
  data?: {
    sid: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

interface UploadResponse {
  success: boolean;
  data?: any;
  error?: {
    code: number;
    message: string;
  };
}

export class DSMFileStationAuth {
  private config: DSMConfig;
  private sessionId: string | null = null;
  private sessionExpiry: number | null = null;

  constructor(config: DSMConfig) {
    this.config = config;
  }

  private getBaseUrl(): string {
    const protocol = this.config.secure ? 'https' : 'http';
    return `${protocol}://${this.config.host}:${this.config.port}`;
  }

  private async makeRequest(endpoint: string, data: Record<string, any>, isMultipart = false): Promise<any> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    let body: FormData | URLSearchParams;
    let headers: Record<string, string> = {};

    if (isMultipart) {
      body = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          body.append(key, value);
        } else {
          body.append(key, String(value));
        }
      });
    } else {
      body = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        body.append(key, String(value));
      });
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async authenticate(): Promise<string> {
    if (this.sessionId && this.sessionExpiry && Date.now() < this.sessionExpiry) {
      return this.sessionId;
    }

    try {
      const authData = {
        api: 'SYNO.API.Auth',
        version: '3',
        method: 'login',
        account: this.config.username,
        passwd: this.config.password,
        session: 'FileStation',
        format: 'sid'
      };

      const response: AuthResponse = await this.makeRequest('/webapi/auth.cgi', authData);

      if (!response.success || !response.data?.sid) {
        throw new Error(`Authentication failed: ${response.error?.message || 'Unknown error'}`);
      }

      this.sessionId = response.data.sid;
      this.sessionExpiry = Date.now() + (30 * 60 * 1000); // 30분 후 만료

      return this.sessionId;
    } catch (error) {
      throw new Error(`DSM authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadFile(file: File, destinationPath: string): Promise<UploadResponse> {
    try {
      const sessionId = await this.authenticate();

      const uploadData = {
        api: 'SYNO.FileStation.Upload',
        version: '2',
        method: 'upload',
        path: destinationPath,
        create_parents: 'true',
        overwrite: 'true',
        _sid: sessionId,
        file: file
      };

      const response: UploadResponse = await this.makeRequest('/webapi/entry.cgi', uploadData, true);

      if (!response.success) {
        throw new Error(`Upload failed: ${response.error?.message || 'Unknown error'}`);
      }

      return response;
    } catch (error) {
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async logout(): Promise<void> {
    if (!this.sessionId) return;

    try {
      const logoutData = {
        api: 'SYNO.API.Auth',
        version: '1',
        method: 'logout',
        session: 'FileStation',
        _sid: this.sessionId
      };

      await this.makeRequest('/webapi/auth.cgi', logoutData);
    } catch (error) {
      console.warn('Logout failed:', error);
    } finally {
      this.sessionId = null;
      this.sessionExpiry = null;
    }
  }

  async createFolder(folderPath: string): Promise<boolean> {
    try {
      const sessionId = await this.authenticate();

      const createData = {
        api: 'SYNO.FileStation.CreateFolder',
        version: '2',
        method: 'create',
        folder_path: folderPath,
        name: '',
        force_parent: 'true',
        _sid: sessionId
      };

      const response = await this.makeRequest('/webapi/entry.cgi', createData);
      return response.success;
    } catch (error) {
      console.error('Create folder failed:', error);
      return false;
    }
  }
}

export function createDSMClient(): DSMFileStationAuth {
  const config: DSMConfig = {
    host: process.env.DSM_HOST || 'localhost',
    port: parseInt(process.env.DSM_PORT || '5000'),
    username: process.env.DSM_USERNAME || '',
    password: process.env.DSM_PASSWORD || '',
    secure: process.env.DSM_SECURE === 'true'
  };

  if (!config.username || !config.password) {
    throw new Error('DSM credentials not configured. Please set DSM_USERNAME and DSM_PASSWORD environment variables.');
  }

  return new DSMFileStationAuth(config);
}