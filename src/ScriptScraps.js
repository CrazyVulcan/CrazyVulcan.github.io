
		// Jean-Luc Picard - Enterprise-D
		"captain:jean_luc_picard_enterprise_72284p": {
			intercept: {
				self: {
					cost: function(upgrade,ship,fleet,cost) {
						modifier = 0;
						
						if ( ship )
							modifier += 2;
						
						if ( modifier > 5)
							modifier = 5;
						
						return cost - modifier;
					}
				}
			}
		},
		
		// Natasha Yar - U.S.S. Enterprise-D
		"crew:natasha_yar_72284p": {
			upgradeSlots: [ 
				{ 
					type: ["weapon"]
				},
				{ 
					type: ["weapon"]
				}
			]
		},
		
		// Aft Phaser Emitters - U.S.S. Enterprise-D
		"weapon:aft_phaser_emitters_72284p": {
			attack: 0,
			// Equip only on a Federation ship with hull 4 or more
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"federation", ship, fleet) && ship.hull >= 4;
			},
			intercept: {
				self: {
					// Attack is same as ship primary - 1
					attack: function(upgrade,ship,fleet,attack) {
						if( ship )
							return valueOf(ship,"attack",ship,fleet) - 1;
						return attack;
					},
					// Cost is primary weapon
					cost: function(upgrade,ship,fleet,cost) {
						if( ship )
							return resolve(upgrade,ship,fleet,cost) + valueOf(ship,"attack",ship,fleet);
						return cost;
					}
				}
			}
		},
		
		// Transporter - U.S.S. Enterprise-D
		"tech:transporter_72284p": {
			rules: "Only one per ship",
			canEquip: onePerShip("Transporter")
		},
		
		// Particle Beam Weapon - Muratas
		"weapon:particle_beam_weapon_muratas": {
			attack: 0,
			// Equip only on a Xindi
			canEquip: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship,"xindi", ship, fleet);
			},
			intercept: {
				self: {
					// Attack is same as ship primary + 1
					attack: function(upgrade,ship,fleet,attack) {
						if( ship )
							return valueOf(ship,"attack",ship,fleet) + 1;
						return attack;
					},
					// Cost is primary weapon
					cost: function(upgrade,ship,fleet,cost) {
						if( ship )
							return resolve(upgrade,ship,fleet,cost) + valueOf(ship,"attack",ship,fleet);
						return cost;
					}
				}
			}
		},
		
		// Auxiliary Power to Shields - I.K.S. Hegh'ta
		"tech:auxiliary_power_to_shields_72281p": {
			rules: "Only one per ship",
			canEquip: onePerShip("Auxiliary Power to Shields")
		},
		
		// Course Change - I.K.S. Hegh'ta
		"crew:change_course_72281p_crew": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		
		"talent:change_course_72281p_talent": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		
		"tech:change_course_72281p_tech": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		
		"weapon:change_course_72281p_weapon": {
			rules: "Only one per ship",
			canEquip: onePerShip("Course Change")
		},
		//Lursa and B'Etor crew
		"crew:lursa_crew_72282p": {
			upgradeSlots: [
				{
					type: ["talent"]
				}
			],
			canEquip: function(upgrade,ship,fleet) {
				return ship.captain && ship.captain.name == "B'Etor";
			},
			intercept: {
				ship: {
					skill: function(upgrade,ship,fleet,skill) {
						if( upgrade == ship.captain )
							return resolve(upgrade,ship,fleet,skill) + 4;
						return skill;
					}
				}
			}
		},
		
		"crew:betor_crew_72282p": {
			upgradeSlots: [ 
				{ 
					type: ["talent"]
				}
			],
			canEquip: function(captain,ship,fleet) {
				return captain.name == "Lursa";
			},
			intercept: {
				ship: {
					skill: function(card,ship,fleet,skill) {
						if( card == ship.captain )
							return resolve(card,ship,fleet,skill) + 4;
						return skill;
					}
				}
			}
		},
		
		"tech:tech_captured_72013wp": {
			upgradeSlots: [
				{
					type: ["tech"]
				}
			],
			intercept: {
				ship: {
					// No faction penalty for upgrades
					factionPenalty: function(card, ship, fleet, factionPenalty) {
						if( hasFaction(upgrade,"independent",ship,fleet) )
							return 0;
						return factionPenalty;
					}
				}
			}
		},
		
		"weapon:weapon_captured_72013wp": {
			upgradeSlots: [
				{
					type: ["weapon"]
				}
			],
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "independent", ship, fleet) && $factions.hasFaction(ship.captain, "independent", ship, fleet);
			}
		},
		
		"crew:crew_captured_72013wp": {
			upgradeSlots: [
				{
					type: ["crew"]
				}
			],
			canEquipFaction: function(upgrade,ship,fleet) {
				return $factions.hasFaction(ship, "independent", ship, fleet) && $factions.hasFaction(ship.captain, "independent", ship, fleet);
			}
		},