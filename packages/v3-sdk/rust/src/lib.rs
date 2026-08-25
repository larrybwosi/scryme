#![allow(unused_imports)]
#![allow(clippy::too_many_arguments)]

extern crate serde_repr;
extern crate serde;
extern crate serde_json;
extern crate url;
extern crate reqwest;

pub mod client;
pub mod configuration;

pub use client::{ScrymeClient, ScrymeClientBuilder};
pub use configuration::Configuration;
