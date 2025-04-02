# AccelMonitor - CoppeliaSim Accelerometer Monitoring

A modern Next.js application for real-time visualization and analysis of accelerometer data from CoppeliaSim simulations.

## Features

- **Real-time Data Visualization**: Monitor accelerometer readings from CoppeliaSim in real-time with interactive charts.
- **Configurable Update Frequency**: Adjust how often the data is fetched and displayed.
- **Statistical Analysis**: Generate comprehensive reports with statistical analysis of accelerometer data.
- **PDF Reports**: Download formatted PDF reports with detailed statistics for specific time intervals.
- **Modern UI**: Clean, responsive design that works on all devices.

## Prerequisites

- Node.js 18.0.0 or newer
- API server running (see below)
- For real data: CoppeliaSim with ZMQ Remote API configured

## Setup and Running

### 1. Setting up the API server

Before running the AccelMonitor frontend, you need to have the API server running that provides accelerometer data. The API server is built with FastAPI and can be found in the `code/api_server.py` file.

To run the API server:

```bash
# Install required packages
pip install fastapi uvicorn

# Run the server
python code/api_server.py
```

The API server will run on http://localhost:8000 by default.

### 2. Setting up CoppeliaSim data collection

There are two ways to get accelerometer data:

#### Option A: Use CoppeliaSim (real simulation)

If you have CoppeliaSim installed:

1. Make sure CoppeliaSim is configured with ZMQ Remote API
2. Run the CoppeliaSim simulation with accelerometer signals named "accelX", "accelY", and "accelZ"
3. Run the data collection script:

```bash
python code/coppelia_probe.py
```

#### Option B: Use the fallback mode (simulated data)

If you don't have CoppeliaSim installed or are having issues with the ZMQ Remote API, the system will automatically fall back to generating simulated accelerometer data:

```bash
python code/coppelia_probe.py
```

The script will show a message indicating it's using the fallback implementation, and will generate random accelerometer-like data for testing.

### 3. Running the AccelMonitor frontend

```bash
# Navigate to the accel-monitor directory
cd accel-monitor

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at http://localhost:3000.

## Usage

1. **View Real-time Data**: The main dashboard displays real-time accelerometer data on a graph.
2. **Adjust Update Frequency**: Use the settings panel to change how often new data is fetched.
3. **Generate Reports**: Select a time interval and generate statistical reports.
4. **Download Reports**: After generating a report, download it as a PDF for record keeping.

## API Endpoints

The backend API server provides these endpoints:

- `GET /`: Basic API information
- `GET /accelerometer`: Retrieve accelerometer readings (accepts `limit` parameter)
- `POST /accelerometer`: Send new accelerometer data from CoppeliaSim simulation

## Deployment on Vercel

### Prerequisites for Deployment

- GitHub account
- Vercel account (can sign up with GitHub)
- Custom domain (optional)

### Creating a GitHub Repository

1. Initialize a local Git repository (if not already done):
   ```bash
   cd accel-monitor
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name your repository (e.g., `accel-monitor`)
   - Choose visibility (public/private)
   - Click "Create repository"

3. Connect your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/your-username/accel-monitor.git
   git branch -M main
   git push -u origin main
   ```

### Deploying to Vercel

1. Log in to Vercel (https://vercel.com) with your GitHub account

2. Import your GitHub repository:
   - Click on "Add New..." > "Project"
   - Select your `accel-monitor` repository
   - Vercel will automatically detect it as a Next.js project

3. Configure environment variables:
   - All Firebase configuration variables are already set in `vercel.json`
   - You can override them in the Vercel dashboard if needed

4. Deploy:
   - Click "Deploy"
   - Vercel will build and deploy your application

### Setting Up a Custom Domain

1. On your project's dashboard, go to "Settings" > "Domains"

2. Add your custom domain:
   - Enter your domain name (e.g., `accel-monitor.yourdomain.com`)
   - Click "Add"

3. Configure your domain's DNS:
   - Follow Vercel's instructions to set up the required DNS records with your domain provider
   - Typically involves adding a CNAME record pointing to `cname.vercel-dns.com`

4. Wait for DNS propagation (can take up to 48 hours, but usually much faster)

### Continuous Deployment

With the GitHub integration, Vercel will automatically deploy new versions whenever you push changes to your repository:

```bash
# Make changes to your code
git add .
git commit -m "Update something"
git push origin main
```

Vercel will detect the changes and automatically build and deploy the new version.

## Environment Variables

The application uses the following environment variables for configuration:

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase authentication domain
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`: Firebase realtime database URL
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase measurement ID for Analytics

These can be configured in the Vercel dashboard or in your local `.env` file for development.

## Troubleshooting

### Module Import Errors

If you encounter module import errors with the ZMQ Remote API, the system will automatically fall back to using simulated data. If you want to fix the import issue:

1. Make sure you have the proper CoppeliaSim ZMQ Remote API Python client installed
2. Check the `code/zmqRemoteApi/__init__.py` file for correct path configurations
3. If needed, install the coppeliasim_zmqremoteapi_client module:

```bash
pip install coppeliasim-zmqremoteapi-client
```

## Development

This project uses:

- Next.js 15.2.3
- React 19.0.0
- Chart.js for data visualization
- jsPDF for report generation

To build for production:

```bash
npm run build
```

## License

This project is open-source and available under the MIT License.
