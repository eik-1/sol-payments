export type SolanaStreamingPayments = {
  "version": "0.1.0",
  "name": "solana_streaming_payments",
  "instructions": [
    {
      "name": "createStream",
      "accounts": [
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payee",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "ratePerMinute",
          "type": "u64"
        },
        {
          "name": "durationMinutes",
          "type": "u64"
        },
        {
          "name": "feePercentage",
          "type": "u8"
        }
      ]
    },
    {
      "name": "redeemStream",
      "accounts": [
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payee",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payeeToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        }
      ]
    },
    {
      "name": "reclaimStream",
      "accounts": [
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payee",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "stream",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "payee",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ratePerMinute",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "durationMinutes",
            "type": "u64"
          },
          {
            "name": "feePercentage",
            "type": "u8"
          },
          {
            "name": "redeemed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NoFundsToRedeem",
      "msg": "No funds available to redeem."
    },
    {
      "code": 6001,
      "name": "StreamNotExpired",
      "msg": "Stream has not expired yet."
    },
    {
      "code": 6002,
      "name": "NoFundsToReclaim",
      "msg": "No funds available to reclaim."
    }
  ]
};

export const IDL: SolanaStreamingPayments = {
  "version": "0.1.0",
  "name": "solana_streaming_payments",
  "instructions": [
    {
      "name": "createStream",
      "accounts": [
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payee",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payerToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "ratePerMinute",
          "type": "u64"
        },
        {
          "name": "durationMinutes",
          "type": "u64"
        },
        {
          "name": "feePercentage",
          "type": "u8"
        }
      ]
    },
    {
      "name": "redeemStream",
      "accounts": [
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payee",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payeeToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "feeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        }
      ]
    },
    {
      "name": "reclaimStream",
      "accounts": [
        {
          "name": "stream",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "payee",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "stream",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "payer",
            "type": "publicKey"
          },
          {
            "name": "payee",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "ratePerMinute",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "durationMinutes",
            "type": "u64"
          },
          {
            "name": "feePercentage",
            "type": "u8"
          },
          {
            "name": "redeemed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NoFundsToRedeem",
      "msg": "No funds available to redeem."
    },
    {
      "code": 6001,
      "name": "StreamNotExpired",
      "msg": "Stream has not expired yet."
    },
    {
      "code": 6002,
      "name": "NoFundsToReclaim",
      "msg": "No funds available to reclaim."
    }
  ]
};