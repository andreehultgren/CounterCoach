export namespace models {
	
	export class UtilityPoint {
	    ID: number;
	    GameID: number;
	    X: number;
	    Y: number;
	    Kind: string;
	    SteamID: number;
	
	    static createFrom(source: any = {}) {
	        return new UtilityPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.GameID = source["GameID"];
	        this.X = source["X"];
	        this.Y = source["Y"];
	        this.Kind = source["Kind"];
	        this.SteamID = source["SteamID"];
	    }
	}
	export class HeatmapPoint {
	    ID: number;
	    GameID: number;
	    X: number;
	    Y: number;
	    Kind: string;
	    SteamID: number;
	
	    static createFrom(source: any = {}) {
	        return new HeatmapPoint(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.GameID = source["GameID"];
	        this.X = source["X"];
	        this.Y = source["Y"];
	        this.Kind = source["Kind"];
	        this.SteamID = source["SteamID"];
	    }
	}
	export class TeamScore {
	    ID: number;
	    GameID: number;
	    Name: string;
	    Score: number;
	
	    static createFrom(source: any = {}) {
	        return new TeamScore(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.GameID = source["GameID"];
	        this.Name = source["Name"];
	        this.Score = source["Score"];
	    }
	}
	export class Round {
	    ID: number;
	    GameID: number;
	    Number: number;
	    WinnerSide: string;
	    WinnerClan: string;
	    LoserClan: string;
	    Reason: string;
	
	    static createFrom(source: any = {}) {
	        return new Round(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.GameID = source["GameID"];
	        this.Number = source["Number"];
	        this.WinnerSide = source["WinnerSide"];
	        this.WinnerClan = source["WinnerClan"];
	        this.LoserClan = source["LoserClan"];
	        this.Reason = source["Reason"];
	    }
	}
	export class PlayerStats {
	    ID: number;
	    GameID: number;
	    SteamID: number;
	    Name: string;
	    Team: string;
	    Kills: number;
	    Deaths: number;
	    Assists: number;
	    Damage: number;
	    FlashesAcquired: number;
	    FlashesThrown: number;
	    FlashRounds: number;
	    FlashesDiedWith: number;
	    EnemyFlashes: number;
	    EnemyFlashSeconds: number;
	    TeamFlashes: number;
	    TeamFlashSeconds: number;
	    HEAcquired: number;
	    HEThrown: number;
	    HEDamage: number;
	    MolotovAcquired: number;
	    MolotovThrown: number;
	    MolotovDamage: number;
	    SmokeAcquired: number;
	    SmokeThrown: number;
	    DecoyAcquired: number;
	    DecoyThrown: number;
	    RifleAccurate: number;
	    RifleRunning: number;
	    RifleJump: number;
	    PistolAccurate: number;
	    PistolRunning: number;
	    PistolJump: number;
	    SMGAccurate: number;
	    SMGRunning: number;
	    SMGJump: number;
	
	    static createFrom(source: any = {}) {
	        return new PlayerStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.GameID = source["GameID"];
	        this.SteamID = source["SteamID"];
	        this.Name = source["Name"];
	        this.Team = source["Team"];
	        this.Kills = source["Kills"];
	        this.Deaths = source["Deaths"];
	        this.Assists = source["Assists"];
	        this.Damage = source["Damage"];
	        this.FlashesAcquired = source["FlashesAcquired"];
	        this.FlashesThrown = source["FlashesThrown"];
	        this.FlashRounds = source["FlashRounds"];
	        this.FlashesDiedWith = source["FlashesDiedWith"];
	        this.EnemyFlashes = source["EnemyFlashes"];
	        this.EnemyFlashSeconds = source["EnemyFlashSeconds"];
	        this.TeamFlashes = source["TeamFlashes"];
	        this.TeamFlashSeconds = source["TeamFlashSeconds"];
	        this.HEAcquired = source["HEAcquired"];
	        this.HEThrown = source["HEThrown"];
	        this.HEDamage = source["HEDamage"];
	        this.MolotovAcquired = source["MolotovAcquired"];
	        this.MolotovThrown = source["MolotovThrown"];
	        this.MolotovDamage = source["MolotovDamage"];
	        this.SmokeAcquired = source["SmokeAcquired"];
	        this.SmokeThrown = source["SmokeThrown"];
	        this.DecoyAcquired = source["DecoyAcquired"];
	        this.DecoyThrown = source["DecoyThrown"];
	        this.RifleAccurate = source["RifleAccurate"];
	        this.RifleRunning = source["RifleRunning"];
	        this.RifleJump = source["RifleJump"];
	        this.PistolAccurate = source["PistolAccurate"];
	        this.PistolRunning = source["PistolRunning"];
	        this.PistolJump = source["PistolJump"];
	        this.SMGAccurate = source["SMGAccurate"];
	        this.SMGRunning = source["SMGRunning"];
	        this.SMGJump = source["SMGJump"];
	    }
	}
	export class Game {
	    ID: number;
	    DemoID: number;
	    FileExists: boolean;
	    FileSize: number;
	    // Go type: time
	    ModifiedAt: any;
	    // Go type: time
	    RecordedAt: any;
	    Format: string;
	    Magic: string;
	    DemoProtocol: number;
	    NetworkProtocol: number;
	    ServerName: string;
	    ClientName: string;
	    MapName: string;
	    GameDirectory: string;
	    PlaybackSeconds: number;
	    Ticks: number;
	    Frames: number;
	    Players: PlayerStats[];
	    Rounds: Round[];
	    Teams: TeamScore[];
	    Heatmap: HeatmapPoint[];
	    Utility: UtilityPoint[];
	
	    static createFrom(source: any = {}) {
	        return new Game(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.DemoID = source["DemoID"];
	        this.FileExists = source["FileExists"];
	        this.FileSize = source["FileSize"];
	        this.ModifiedAt = this.convertValues(source["ModifiedAt"], null);
	        this.RecordedAt = this.convertValues(source["RecordedAt"], null);
	        this.Format = source["Format"];
	        this.Magic = source["Magic"];
	        this.DemoProtocol = source["DemoProtocol"];
	        this.NetworkProtocol = source["NetworkProtocol"];
	        this.ServerName = source["ServerName"];
	        this.ClientName = source["ClientName"];
	        this.MapName = source["MapName"];
	        this.GameDirectory = source["GameDirectory"];
	        this.PlaybackSeconds = source["PlaybackSeconds"];
	        this.Ticks = source["Ticks"];
	        this.Frames = source["Frames"];
	        this.Players = this.convertValues(source["Players"], PlayerStats);
	        this.Rounds = this.convertValues(source["Rounds"], Round);
	        this.Teams = this.convertValues(source["Teams"], TeamScore);
	        this.Heatmap = this.convertValues(source["Heatmap"], HeatmapPoint);
	        this.Utility = this.convertValues(source["Utility"], UtilityPoint);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Demo {
	    ID: number;
	    // Go type: time
	    CreatedAt: any;
	    // Go type: time
	    UpdatedAt: any;
	    Path: string;
	    Exists: boolean;
	    Game?: Game;
	
	    static createFrom(source: any = {}) {
	        return new Demo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.CreatedAt = this.convertValues(source["CreatedAt"], null);
	        this.UpdatedAt = this.convertValues(source["UpdatedAt"], null);
	        this.Path = source["Path"];
	        this.Exists = source["Exists"];
	        this.Game = this.convertValues(source["Game"], Game);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class PlayerGameStat {
	    DemoID: number;
	    GameID: number;
	    Map: string;
	    // Go type: time
	    RecordedAt: any;
	    Team: string;
	    Kills: number;
	    Deaths: number;
	    Assists: number;
	    ADR: number;
	    Accuracy: number;
	    EnemyFlashes: number;
	    AvgBlindPerFlash: number;
	
	    static createFrom(source: any = {}) {
	        return new PlayerGameStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.DemoID = source["DemoID"];
	        this.GameID = source["GameID"];
	        this.Map = source["Map"];
	        this.RecordedAt = this.convertValues(source["RecordedAt"], null);
	        this.Team = source["Team"];
	        this.Kills = source["Kills"];
	        this.Deaths = source["Deaths"];
	        this.Assists = source["Assists"];
	        this.ADR = source["ADR"];
	        this.Accuracy = source["Accuracy"];
	        this.EnemyFlashes = source["EnemyFlashes"];
	        this.AvgBlindPerFlash = source["AvgBlindPerFlash"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PlayerListItem {
	    SteamID: string;
	    Name: string;
	    Games: number;
	    Kills: number;
	    Deaths: number;
	    Assists: number;
	
	    static createFrom(source: any = {}) {
	        return new PlayerListItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.SteamID = source["SteamID"];
	        this.Name = source["Name"];
	        this.Games = source["Games"];
	        this.Kills = source["Kills"];
	        this.Deaths = source["Deaths"];
	        this.Assists = source["Assists"];
	    }
	}
	export class PlayerProfile {
	    SteamID: string;
	    Name: string;
	    Games: number;
	    Kills: number;
	    Deaths: number;
	    Assists: number;
	    ADR: number;
	    Matches: PlayerGameStat[];
	
	    static createFrom(source: any = {}) {
	        return new PlayerProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.SteamID = source["SteamID"];
	        this.Name = source["Name"];
	        this.Games = source["Games"];
	        this.Kills = source["Kills"];
	        this.Deaths = source["Deaths"];
	        this.Assists = source["Assists"];
	        this.ADR = source["ADR"];
	        this.Matches = this.convertValues(source["Matches"], PlayerGameStat);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	

}

