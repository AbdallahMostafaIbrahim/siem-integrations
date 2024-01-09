import axios from "axios";

class Crowdstrike {
  public constructor(
    private client_id: string,
    private client_secret: string,
    private region: string
  ) {}

  private authUrl = `https://api.crowdstrike.com/oauth2/token`;
  private detectionsUrl = `https://api.${this.region}.crowdstrike.com/detects/queries/detects/v1`;
  private detectionDetailsUrl = `https://api.${this.region}.crowdstrike.com/detects/entities/summaries/GET/v1`;

  private accessToken: string = "";

  public async refreshAccessToken() {
    const response = await axios.post(
      this.authUrl,
      `client_id=${this.client_id}&client_secret=${this.client_secret}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    this.accessToken = response.data.access_token;
  }

  public async getDetections(): Promise<string[]> {
    try {
      const response = await axios.get(
        `${this.detectionsUrl}?limit=9999&sort=last_behavior|asc`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );

      return response.data.resources;
    } catch (error: any) {
      if (error.response) {
        console.dir(error.response.data, { depth: null });
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log("Error", error.message);
      }
      return [];
    }
  }

  public async getDetectionSummaries(detectionIds: string[]) {
    try {
      const response = await axios.post(
        this.detectionDetailsUrl,
        { ids: detectionIds },
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );
      return response.data.resources;
    } catch (error: any) {
      if (error.response) {
        console.dir(error.response.data, { depth: null });
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log("Error", error.message);
      }
      return [];
    }
  }
}

export default Crowdstrike;
