
import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const accounts = new SharedArray('accounts', () => {
  return open('./kredensial-pemilih.csv')
    .trim()
    .split(/\r?\n/)
    .slice(1) // Lewati header CSV
    .map((line) => {
      const columns = line.split(',');
      return {
        nim: columns[0].trim(),
        password: columns[3].trim(),
      };
    });
});

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8080';

const loginSuccess = new Rate('login_success');
const loginFailures = new Counter('login_failures');
const loginDuration = new Trend('login_duration');

export const options = {
  scenarios: {
    login_141_users: {
      executor: 'per-vu-iterations',
      vus: 141,
      iterations: 1,
      maxDuration: '120s',
    },
  },
  thresholds: {
    login_success: ['rate>0.95'],
    login_duration: ['p(95)<2000'],
  },
};

export function setup() {
  if (accounts.length !== 141) {
    throw new Error(
      `Diharapkan 141 akun, ditemukan ${accounts.length}`
    );
  }

  return { accountCount: accounts.length };
}

export default function () {
  const account = accounts[__VU - 1];

  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      nim: account.nim,
      password: account.password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: '30s',
      tags: { endpoint: 'login' },
    }
  );

  const success = check(response, {
    'login berhasil (HTTP 2xx)': (r) =>
      r.status >= 200 && r.status < 300,
  });

  loginSuccess.add(success);
  loginDuration.add(response.timings.duration);

  if (!success) {
    loginFailures.add(1);
    console.log(
      `Login gagal: VU=${__VU}, HTTP=${response.status}`
    );
  }
}
