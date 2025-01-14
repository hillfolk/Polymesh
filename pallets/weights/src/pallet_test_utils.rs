// This file is part of Substrate.

// Copyright (C) 2021 Parity Technologies (UK) Ltd.
// SPDX-License-Identifier: Apache-2.0

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//! Autogenerated weights for pallet_test_utils
//!
//! THIS FILE WAS AUTO-GENERATED USING THE SUBSTRATE BENCHMARK CLI VERSION 4.0.0-dev
//! DATE: 2023-01-25, STEPS: `100`, REPEAT: 5, LOW RANGE: `[]`, HIGH RANGE: `[]`
//! EXECUTION: Some(Wasm), WASM-EXECUTION: Compiled, CHAIN: None, DB CACHE: 512
//! HOSTNAME: `dev-fsn001`, CPU: `AMD Ryzen 9 5950X 16-Core Processor`

// Executed Command:
// ./target/release/polymesh
// benchmark
// pallet
// -s
// 100
// -r
// 5
// -p=pallet_test_utils
// -e=*
// --heap-pages
// 4096
// --db-cache
// 512
// --execution
// wasm
// --wasm-execution
// compiled
// --output
// ./pallets/weights/src/
// --template
// ./.maintain/frame-weight-template.hbs

#![allow(unused_parens)]
#![allow(unused_imports)]

use polymesh_runtime_common::{RocksDbWeight as DbWeight, Weight};

/// Weights for pallet_test_utils using the Substrate node and recommended hardware.
pub struct SubstrateWeight;
impl pallet_test_utils::WeightInfo for SubstrateWeight {
    // Storage: Identity MultiPurposeNonce (r:1 w:1)
    // Storage: Identity KeyRecords (r:1 w:1)
    // Storage: System ParentHash (r:1 w:0)
    // Storage: Identity DidRecords (r:1 w:1)
    // Storage: ProtocolFee Coefficient (r:1 w:0)
    // Storage: ProtocolFee BaseFees (r:1 w:0)
    // Storage: Timestamp Now (r:1 w:0)
    // Storage: Identity Claims (r:1 w:1)
    // Storage: Identity DidKeys (r:0 w:1)
    // Storage: Identity AuthorizationsGiven (r:0 w:1)
    // Storage: Identity Authorizations (r:0 w:1)
    /// The range of component `i` is `[0, 100]`.
    fn register_did(i: u32) -> Weight {
        // Minimum execution time: 605_307 nanoseconds.
        Weight::from_ref_time(621_874_961)
            // Standard Error: 13_436
            .saturating_add(Weight::from_ref_time(10_500_069).saturating_mul(i.into()))
            .saturating_add(DbWeight::get().reads(8))
            .saturating_add(DbWeight::get().reads((1_u64).saturating_mul(i.into())))
            .saturating_add(DbWeight::get().writes(5))
            .saturating_add(DbWeight::get().writes((2_u64).saturating_mul(i.into())))
    }
    // Storage: Identity KeyRecords (r:2 w:1)
    // Storage: Instance2Group ActiveMembers (r:1 w:0)
    // Storage: Identity MultiPurposeNonce (r:1 w:1)
    // Storage: System ParentHash (r:1 w:0)
    // Storage: Identity DidRecords (r:1 w:1)
    // Storage: ProtocolFee Coefficient (r:1 w:0)
    // Storage: ProtocolFee BaseFees (r:1 w:0)
    // Storage: Timestamp Now (r:1 w:0)
    // Storage: Identity Claims (r:1 w:1)
    // Storage: Identity DidKeys (r:0 w:1)
    fn mock_cdd_register_did() -> Weight {
        // Minimum execution time: 613_513 nanoseconds.
        Weight::from_ref_time(615_026_000)
            .saturating_add(DbWeight::get().reads(10))
            .saturating_add(DbWeight::get().writes(5))
    }
    // Storage: Identity KeyRecords (r:1 w:0)
    fn get_my_did() -> Weight {
        // Minimum execution time: 27_520 nanoseconds.
        Weight::from_ref_time(28_131_000).saturating_add(DbWeight::get().reads(1))
    }
    // Storage: Identity KeyRecords (r:1 w:0)
    // Storage: Timestamp Now (r:1 w:0)
    // Storage: Instance2Group ActiveMembers (r:1 w:0)
    // Storage: Instance2Group InactiveMembers (r:1 w:0)
    // Storage: Identity Claims (r:2 w:0)
    fn get_cdd_of() -> Weight {
        // Minimum execution time: 49_261 nanoseconds.
        Weight::from_ref_time(50_162_000).saturating_add(DbWeight::get().reads(6))
    }
}
