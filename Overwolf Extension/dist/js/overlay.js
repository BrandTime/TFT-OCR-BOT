/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/overlay/overlay.ts":
/*!********************************!*\
  !*** ./src/overlay/overlay.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.overlay = exports.Overlay = void 0;
class Overlay {
    constructor() {
        this.players = [];
        this.selfName = "";
        this.path = "E:\\Development\\Python\\TFT-OCR-BOT-main\\live_data\\";
        this.g_interestedInFeatures = [
            'counters',
            'match_info',
            'me',
            'roster',
            'store',
            'board',
            'bench',
            'carousel',
            'live_client_data'
        ];
        this.setup();
    }
    setup() {
        overwolf.games.onGameInfoUpdated.addListener((res) => {
            console.debug("onGameInfoUpdated", res);
            if (res.gameChanged) {
                this.players = [];
            }
            if (Overlay.gameLaunched(res)) {
                this.registerEvents();
                setTimeout(() => this.setFeatures(), 1000);
            }
        });
        overwolf.games.getRunningGameInfo((res) => {
            console.debug("getRunningGameInfo", res);
            if (Overlay.gameRunning(res)) {
                this.registerEvents();
                setTimeout(() => this.setFeatures(), 1000);
            }
            else {
                this.players = [];
            }
        });
        overwolf.games.launchers.events.getInfo(10902, info => {
            if (info.success) {
                this.selfName = info.res.summoner_info.display_name;
            }
        });
        this.setPosition();
    }
    setFeatures() {
        overwolf.games.events.setRequiredFeatures(this.g_interestedInFeatures, (info) => {
            if (!info.success) {
                window.setTimeout(() => this.setFeatures(), 2000);
                return;
            }
            console.info("Set required features:");
            console.info(JSON.stringify(info));
        });
    }
    handleEvent(info) {
        const feature = info.feature;
        const key = info.key;
        console.info(JSON.stringify(info));
        if (feature === "roster" && key === "player_status") {
            this.handleRoster(info.value);
        }
        else if (feature === "match_info" && key === "opponent") {
            this.setLastOpponent(info.value);
        }
    }
    handleRoster(jsonStr) {
        const roster = JSON.parse(jsonStr);
        const players = [];
        for (const name in roster) {
            const playerData = roster[name];
            playerData.name = name;
            players.push(playerData);
        }
        players.sort((a, b) => a.index - b.index);
        if (players.length) {
            if (this.players.length && players.length) {
                this.updateRoster(players);
            }
            else {
                this.setupRoster(players);
            }
        }
    }
    async setupRoster(players) {
        console.info("Initialising roster", players);
        if (!this.selfName) {
            this.selfName = await this.getSummonerName();
        }
        this.reset();
        players.forEach((data, i) => {
            if (data.name !== this.selfName) {
                const box = document.querySelector(`#box-${i}`);
                const player = { name: data.name, box: box };
                player.box.style.borderColor = "green";
                this.players.push(player);
            }
        });
        this.setPosition();
    }
    updateRoster(players) {
        console.info("Updating roster");
        const me = players.find(player => player.name === this.selfName);
        if (me && me.health <= 0) {
            this.reset();
            return;
        }
        this.players.forEach(player => {
            players.forEach(data => {
                if (player.name === data.name && data.health <= 0) {
                    this.removePlayer(data.name.trim());
                }
            });
        });
    }
    removePlayer(name) {
        console.info(`Removing: ${name}`);
        const player = this.players.find(player => player.name.trim() === name.trim());
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players.splice(index, 1);
            player.box.style.borderColor = "transparent";
            this.clear();
        }
    }
    setLastOpponent(jsonStr) {
        if (this.players.length === 0) {
            return;
        }
        const opponentName = JSON.parse(jsonStr).name.trim();
        const opponent = this.players.find(player => player.name === opponentName);
        const index = this.players.indexOf(opponent);
        console.info(`LAST OPPONENT WAS ${opponentName}`);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.players.push(opponent);
            opponent.box.style.borderColor = "red";
        }
        this.updateOverlay();
    }
    updateOverlay() {
        const potentialCount = this.players.length > 3 ? 3 : this.players.length - 1;
        this.players.slice(0, potentialCount).forEach(player => {
            player.box.style.borderColor = "green";
        });
    }
    clear() {
        console.info(`A player was eliminated, clearing`);
        this.players.forEach(player => {
            player.box.style.borderColor = "green";
        });
    }
    reset() {
        console.info("Reset");
        document.querySelectorAll(`.box`).forEach((box) => box.style.borderColor = "transparent");
        this.players = [];
    }
    setDebug() {
        const debugEl = document.querySelector(".debug");
        debugEl.innerHTML = `${this.selfName}<br>${this.players.map(player => player.name).join("<br>")}`;
        setTimeout(() => this.setDebug(), 1000);
    }
    registerEvents() {
        console.info("register events");
        overwolf.games.events.onError.addListener((event) => {
            console.info("Error: " + JSON.stringify(event));
        });
        overwolf.games.events.onInfoUpdates2.addListener((event) => {
            this.handleEvent("Info UPDATE: " + JSON.stringify(event));
            switch (event.feature) {
                case "store":
                    if (event.info)
                        overwolf.io.writeFileContents(this.path + "store.txt", JSON.stringify(event.info), "UTF8", false, event => { });
                    break;
                case "board":
                    if (event.info)
                        overwolf.io.writeFileContents(this.path + "board.txt", JSON.stringify(event.info), "UTF8", false, event => { });
                    break;
                case "bench":
                    if (event.info)
                        overwolf.io.writeFileContents(this.path + "bench.txt", JSON.stringify(event.info), "UTF8", false, event => { });
                    break;
            }
        });
        overwolf.games.events.onNewEvents.addListener((event) => {
            this.handleEvent("EVENT FIRED: " + JSON.stringify(event));
        });
    }
    static gameLaunched(gameInfoResult) {
        if (!gameInfoResult) {
            return false;
        }
        if (!gameInfoResult.gameInfo) {
            return false;
        }
        if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
            return false;
        }
        if (!gameInfoResult.gameInfo.isRunning) {
            return false;
        }
        if (Math.floor(gameInfoResult.gameInfo.id / 10) != 5426) {
            return false;
        }
        console.info("TFT Launched");
        return true;
    }
    static gameRunning(gameInfo) {
        if (!gameInfo) {
            return false;
        }
        if (!gameInfo.isRunning) {
            return false;
        }
        if (Math.floor(gameInfo.id / 10) != 5426) {
            return false;
        }
        console.info("TFT running");
        return true;
    }
    async setPosition() {
        const gameRes = await this.getGameResolution();
        if (gameRes === null) {
            return;
        }
        const appRes = await this.getAppResolution();
        overwolf.windows.changeSize("overlay", 350, 170);
        overwolf.windows.changePosition("overlay", gameRes.width - appRes.width, gameRes.height - appRes.height);
    }
    getGameResolution() {
        return new Promise(resolve => {
            overwolf.games.getRunningGameInfo((result) => {
                if (result && result.logicalWidth) {
                    resolve({
                        width: result.logicalWidth,
                        height: result.logicalHeight
                    });
                }
                else {
                    resolve(null);
                }
            });
        });
    }
    getAppResolution() {
        return new Promise(resolve => {
            overwolf.windows.getCurrentWindow((result) => {
                resolve({
                    width: result.window.width,
                    height: result.window.height
                });
            });
        });
    }
    getSummonerName() {
        return new Promise(resolve => {
            overwolf.games.launchers.events.getInfo(10902, info => {
                if (info.success) {
                    resolve(info.res.summoner_info.display_name);
                }
                else {
                    setTimeout(() => {
                        console.log("Failed to get summoner name, trying again in 2s");
                        resolve(this.getSummonerName());
                    }, 2000);
                }
            });
        });
    }
}
exports.Overlay = Overlay;
exports.overlay = new Overlay();
window.overlay = exports.overlay;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/overlay/overlay.ts"](0, __webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90ZnQtc2NvdXQvLi9zcmMvb3ZlcmxheS9vdmVybGF5LnRzIiwid2VicGFjazovL3RmdC1zY291dC93ZWJwYWNrL3N0YXJ0dXAiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQWdCQSxNQUFhLE9BQU87SUFpQmhCO1FBZlEsWUFBTyxHQUFhLEVBQUUsQ0FBQztRQUN2QixhQUFRLEdBQVcsRUFBRSxDQUFDO1FBQ3RCLFNBQUksR0FBVyx3REFBd0QsQ0FBQztRQUN4RSwyQkFBc0IsR0FBRztZQUM3QixVQUFVO1lBQ1YsWUFBWTtZQUNaLElBQUk7WUFDSixRQUFRO1lBQ1IsT0FBTztZQUNQLE9BQU87WUFDUCxPQUFPO1lBQ1AsVUFBVTtZQUNWLGtCQUFrQjtTQUNyQixDQUFDO1FBR0UsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBR2pCLENBQUM7SUFFTyxLQUFLO1FBQ1QsUUFBUSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNqRCxPQUFPLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3hDLElBQUksR0FBRyxDQUFDLFdBQVcsRUFBQztnQkFDaEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7YUFDckI7WUFDRCxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDdEIsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUM5QztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLENBQUM7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RUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUs7b0JBQzFCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU07aUJBQy9CLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sZUFBZTtRQUNuQixPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3pCLFFBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFO2dCQUNsRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUM7b0JBQ2IsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO2lCQUNoRDtxQkFBTTtvQkFDSCxVQUFVLENBQUMsR0FBRyxFQUFFO3dCQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsaURBQWlELENBQUMsQ0FBQzt3QkFDL0QsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO29CQUNwQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ1o7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBdFdELDBCQXNXQztBQUVZLGVBQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ3JDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsZUFBTyxDQUFDOzs7Ozs7OztVQ3pYekI7VUFDQTtVQUNBO1VBQ0E7VUFDQSIsImZpbGUiOiJqcy9vdmVybGF5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT1dHYW1lc0V2ZW50cyB9IGZyb20gXCJAb3ZlcndvbGYvb3ZlcndvbGYtYXBpLXRzL2Rpc3RcIjtcblxuZGVjbGFyZSB2YXIgd2luZG93OiBhbnk7XG5cbmludGVyZmFjZSBQbGF5ZXIge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBib3g6IEhUTUxFbGVtZW50O1xufVxuXG5pbnRlcmZhY2UgUGxheWVyRGF0YXtcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBoZWFsdGg6IG51bWJlcjtcbiAgICB4cDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgT3ZlcmxheSB7XG5cbiAgICBwcml2YXRlIHBsYXllcnM6IFBsYXllcltdID0gW107XG4gICAgcHJpdmF0ZSBzZWxmTmFtZTogc3RyaW5nID0gXCJcIjtcbiAgICBwcml2YXRlIHBhdGg6IHN0cmluZyA9IFwiRTpcXFxcRGV2ZWxvcG1lbnRcXFxcUHl0aG9uXFxcXFRGVC1PQ1ItQk9ULW1haW5cXFxcbGl2ZV9kYXRhXFxcXFwiO1xuICAgIHByaXZhdGUgZ19pbnRlcmVzdGVkSW5GZWF0dXJlcyA9IFtcbiAgICAgICAgJ2NvdW50ZXJzJyxcbiAgICAgICAgJ21hdGNoX2luZm8nLFxuICAgICAgICAnbWUnLFxuICAgICAgICAncm9zdGVyJyxcbiAgICAgICAgJ3N0b3JlJyxcbiAgICAgICAgJ2JvYXJkJyxcbiAgICAgICAgJ2JlbmNoJyxcbiAgICAgICAgJ2Nhcm91c2VsJyxcbiAgICAgICAgJ2xpdmVfY2xpZW50X2RhdGEnXG4gICAgXTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnNldHVwKCk7XG5cbiAgICAgICAgLy90aGlzLnNldERlYnVnKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXR1cCgpe1xuICAgICAgICBvdmVyd29sZi5nYW1lcy5vbkdhbWVJbmZvVXBkYXRlZC5hZGRMaXN0ZW5lcigocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwib25HYW1lSW5mb1VwZGF0ZWRcIiwgcmVzKTtcbiAgICAgICAgICAgIGlmIChyZXMuZ2FtZUNoYW5nZWQpe1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE92ZXJsYXkuZ2FtZUxhdW5jaGVkKHJlcykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyRXZlbnRzKCk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnNldEZlYXR1cmVzKCksIDEwMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBvdmVyd29sZi5nYW1lcy5nZXRSdW5uaW5nR2FtZUluZm8oKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcImdldFJ1bm5pbmdHYW1lSW5mb1wiLCByZXMpO1xuICAgICAgICAgICAgaWYgKE92ZXJsYXkuZ2FtZVJ1bm5pbmcocmVzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJFdmVudHMoKTtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuc2V0RmVhdHVyZXMoKSwgMTAwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVycyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBvdmVyd29sZi5nYW1lcy5sYXVuY2hlcnMuZXZlbnRzLmdldEluZm8oMTA5MDIsIGluZm8gPT4ge1xuICAgICAgICAgICAgaWYgKGluZm8uc3VjY2Vzcyl7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxmTmFtZSA9IGluZm8ucmVzLnN1bW1vbmVyX2luZm8uZGlzcGxheV9uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnNldFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRGZWF0dXJlcygpIHtcbiAgICAgICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLnNldFJlcXVpcmVkRmVhdHVyZXModGhpcy5nX2ludGVyZXN0ZWRJbkZlYXR1cmVzLCAoaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWluZm8uc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhcIkNvdWxkIG5vdCBzZXQgcmVxdWlyZWQgZmVhdHVyZXM6IFwiICsgaW5mby5yZWFzb24pO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhcIlRyeWluZyBpbiAyIHNlY29uZHNcIik7XG4gICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5zZXRGZWF0dXJlcygpLCAyMDAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcIlNldCByZXF1aXJlZCBmZWF0dXJlczpcIik7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oSlNPTi5zdHJpbmdpZnkoaW5mbykpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZUV2ZW50KGluZm86IGFueSl7XG4gICAgICAgIGNvbnN0IGZlYXR1cmUgPSBpbmZvLmZlYXR1cmU7XG4gICAgICAgIGNvbnN0IGtleSA9IGluZm8ua2V5O1xuXHRcdFxuXHRcdGNvbnNvbGUuaW5mbyhKU09OLnN0cmluZ2lmeShpbmZvKSk7XG5cbiAgICAgICAgaWYgKGZlYXR1cmUgPT09IFwicm9zdGVyXCIgJiYga2V5ID09PSBcInBsYXllcl9zdGF0dXNcIil7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZVJvc3RlcihpbmZvLnZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChmZWF0dXJlID09PSBcIm1hdGNoX2luZm9cIiAmJiBrZXkgPT09IFwib3Bwb25lbnRcIil7XG4gICAgICAgICAgICB0aGlzLnNldExhc3RPcHBvbmVudChpbmZvLnZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlUm9zdGVyKGpzb25TdHI6IHN0cmluZyl7XG4gICAgICAgIGNvbnN0IHJvc3RlciA9IEpTT04ucGFyc2UoanNvblN0cik7XG5cbiAgICAgICAgY29uc3QgcGxheWVyczogQXJyYXk8UGxheWVyRGF0YT4gPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gcm9zdGVyKXtcbiAgICAgICAgICAgIGNvbnN0IHBsYXllckRhdGE6IFBsYXllckRhdGEgPSByb3N0ZXJbbmFtZV07XG4gICAgICAgICAgICBwbGF5ZXJEYXRhLm5hbWUgPSBuYW1lO1xuXG4gICAgICAgICAgICBwbGF5ZXJzLnB1c2gocGxheWVyRGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBwbGF5ZXJzLnNvcnQoKGEsIGIpID0+IGEuaW5kZXggLSBiLmluZGV4KTtcblxuICAgICAgICBpZiAocGxheWVycy5sZW5ndGgpe1xuICAgICAgICAgICAgaWYgKHRoaXMucGxheWVycy5sZW5ndGggJiYgcGxheWVycy5sZW5ndGgpe1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUm9zdGVyKHBsYXllcnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHVwUm9zdGVyKHBsYXllcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzZXR1cFJvc3RlcihwbGF5ZXJzOiBQbGF5ZXJEYXRhW10pe1xuICAgICAgICBjb25zb2xlLmluZm8oXCJJbml0aWFsaXNpbmcgcm9zdGVyXCIsIHBsYXllcnMpO1xuXG4gICAgICAgIGlmICghdGhpcy5zZWxmTmFtZSl7XG4gICAgICAgICAgICB0aGlzLnNlbGZOYW1lID0gYXdhaXQgdGhpcy5nZXRTdW1tb25lck5hbWUoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIHBsYXllcnMuZm9yRWFjaCgoZGF0YSwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKGRhdGEubmFtZSAhPT0gdGhpcy5zZWxmTmFtZSl7XG4gICAgICAgICAgICAgICAgY29uc3QgYm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2JveC0ke2l9YCkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgY29uc3QgcGxheWVyOiBQbGF5ZXIgPSB7IG5hbWU6IGRhdGEubmFtZSwgYm94OiBib3ggfTtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuYm94LnN0eWxlLmJvcmRlckNvbG9yID0gXCJncmVlblwiO1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuc2V0UG9zaXRpb24oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVJvc3RlcihwbGF5ZXJzOiBQbGF5ZXJEYXRhW10pe1xuICAgICAgICBjb25zb2xlLmluZm8oXCJVcGRhdGluZyByb3N0ZXJcIik7XG5cbiAgICAgICAgY29uc3QgbWUgPSBwbGF5ZXJzLmZpbmQocGxheWVyID0+IHBsYXllci5uYW1lID09PSB0aGlzLnNlbGZOYW1lKTtcbiAgICAgICAgaWYgKG1lICYmIG1lLmhlYWx0aCA8PSAwKXtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBwbGF5ZXJzLmZvckVhY2goZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHBsYXllci5uYW1lID09PSBkYXRhLm5hbWUgJiYgZGF0YS5oZWFsdGggPD0gMCl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlUGxheWVyKGRhdGEubmFtZS50cmltKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbW92ZVBsYXllcihuYW1lOiBzdHJpbmcpe1xuICAgICAgICBjb25zb2xlLmluZm8oYFJlbW92aW5nOiAke25hbWV9YCk7XG5cbiAgICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5wbGF5ZXJzLmZpbmQocGxheWVyID0+IHBsYXllci5uYW1lLnRyaW0oKSA9PT0gbmFtZS50cmltKCkpO1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMucGxheWVycy5pbmRleE9mKHBsYXllcik7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSl7XG4gICAgICAgICAgICB0aGlzLnBsYXllcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHBsYXllci5ib3guc3R5bGUuYm9yZGVyQ29sb3IgPSBcInRyYW5zcGFyZW50XCI7XG4gICAgICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNldExhc3RPcHBvbmVudChqc29uU3RyOiBzdHJpbmcpe1xuICAgICAgICBpZiAodGhpcy5wbGF5ZXJzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBvcHBvbmVudE5hbWUgPSBKU09OLnBhcnNlKGpzb25TdHIpLm5hbWUudHJpbSgpO1xuICAgICAgICBjb25zdCBvcHBvbmVudCA9IHRoaXMucGxheWVycy5maW5kKHBsYXllciA9PiBwbGF5ZXIubmFtZSA9PT0gb3Bwb25lbnROYW1lKTtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnBsYXllcnMuaW5kZXhPZihvcHBvbmVudCk7XG5cbiAgICAgICAgY29uc29sZS5pbmZvKGBMQVNUIE9QUE9ORU5UIFdBUyAke29wcG9uZW50TmFtZX1gKTtcblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKXtcbiAgICAgICAgICAgIHRoaXMucGxheWVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5wbGF5ZXJzLnB1c2gob3Bwb25lbnQpO1xuICAgICAgICAgICAgb3Bwb25lbnQuYm94LnN0eWxlLmJvcmRlckNvbG9yID0gXCJyZWRcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlT3ZlcmxheSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlT3ZlcmxheSgpe1xuICAgICAgICBjb25zdCBwb3RlbnRpYWxDb3VudCA9IHRoaXMucGxheWVycy5sZW5ndGggPiAzID8gMyA6IHRoaXMucGxheWVycy5sZW5ndGggLSAxO1xuXG4gICAgICAgIHRoaXMucGxheWVycy5zbGljZSgwLCBwb3RlbnRpYWxDb3VudCkuZm9yRWFjaChwbGF5ZXIgPT4ge1xuICAgICAgICAgICAgcGxheWVyLmJveC5zdHlsZS5ib3JkZXJDb2xvciA9IFwiZ3JlZW5cIjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbGVhcigpe1xuICAgICAgICBjb25zb2xlLmluZm8oYEEgcGxheWVyIHdhcyBlbGltaW5hdGVkLCBjbGVhcmluZ2ApO1xuXG4gICAgICAgIHRoaXMucGxheWVycy5mb3JFYWNoKHBsYXllciA9PiB7XG4gICAgICAgICAgICBwbGF5ZXIuYm94LnN0eWxlLmJvcmRlckNvbG9yID0gXCJncmVlblwiO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc2V0KCl7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIlJlc2V0XCIpO1xuXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC5ib3hgKS5mb3JFYWNoKChib3g6IGFueSkgPT4gYm94LnN0eWxlLmJvcmRlckNvbG9yID0gXCJ0cmFuc3BhcmVudFwiKTtcblxuICAgICAgICB0aGlzLnBsYXllcnMgPSBbXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldERlYnVnKCl7XG4gICAgICAgIGNvbnN0IGRlYnVnRWw6IEhUTUxFbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5kZWJ1Z1wiKTtcbiAgICAgICAgZGVidWdFbC5pbm5lckhUTUwgPSBgJHt0aGlzLnNlbGZOYW1lfTxicj4ke3RoaXMucGxheWVycy5tYXAocGxheWVyID0+IHBsYXllci5uYW1lKS5qb2luKFwiPGJyPlwiKX1gO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5zZXREZWJ1ZygpLCAxMDAwKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlZ2lzdGVyRXZlbnRzKCkge1xuICAgICAgICBjb25zb2xlLmluZm8oXCJyZWdpc3RlciBldmVudHNcIik7XG5cbiAgICAgICAgb3ZlcndvbGYuZ2FtZXMuZXZlbnRzLm9uRXJyb3IuYWRkTGlzdGVuZXIoKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFcnJvcjogXCIgKyBKU09OLnN0cmluZ2lmeShldmVudCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICBvdmVyd29sZi5nYW1lcy5ldmVudHMub25JbmZvVXBkYXRlczIuYWRkTGlzdGVuZXIoKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUV2ZW50KFwiSW5mbyBVUERBVEU6IFwiICsgSlNPTi5zdHJpbmdpZnkoZXZlbnQpKTtcblxuICAgICAgICAgICAgc3dpdGNoIChldmVudC5mZWF0dXJlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcInN0b3JlXCI6XG4gICAgICAgICAgICAgICAgICAgIGlmKGV2ZW50LmluZm8pXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd29sZi5pby53cml0ZUZpbGVDb250ZW50cyh0aGlzLnBhdGggKyBcInN0b3JlLnR4dFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGV2ZW50LmluZm8pLCBvdmVyd29sZi5pby5lbnVtcy5lRW5jb2RpbmcuVVRGOCwgZmFsc2UsIGV2ZW50ID0+IHsgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJib2FyZFwiOlxuICAgICAgICAgICAgICAgICAgICBpZihldmVudC5pbmZvKVxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcndvbGYuaW8ud3JpdGVGaWxlQ29udGVudHModGhpcy5wYXRoICsgXCJib2FyZC50eHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShldmVudC5pbmZvKSwgb3ZlcndvbGYuaW8uZW51bXMuZUVuY29kaW5nLlVURjgsIGZhbHNlLCBldmVudCA9PiB7IH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiYmVuY2hcIjpcbiAgICAgICAgICAgICAgICAgICAgaWYoZXZlbnQuaW5mbylcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJ3b2xmLmlvLndyaXRlRmlsZUNvbnRlbnRzKHRoaXMucGF0aCArIFwiYmVuY2gudHh0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZXZlbnQuaW5mbyksIG92ZXJ3b2xmLmlvLmVudW1zLmVFbmNvZGluZy5VVEY4LCBmYWxzZSwgZXZlbnQgPT4geyB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gY2FzZSBcIkdhbWVTdGFydFwiOlxuICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLmlzSW5DaGFtcFNlbGVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBjYXNlIFwiV2FpdGluZ0ZvclN0YXRzXCI6XG4gICAgICAgICAgICAgICAgLy8gY2FzZSBcIlByZUVuZE9mR2FtZVwiOlxuICAgICAgICAgICAgICAgIC8vIGNhc2UgXCJFbmRPZkdhbWVcIjpcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5pc0luQ2hhbXBTZWxlY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5pc0luR2FtZVN0YXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5pc0luQ2hhbXBTZWxlY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5pc0luR2FtZVN0YXRzID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cblxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG92ZXJ3b2xmLmdhbWVzLmV2ZW50cy5vbk5ld0V2ZW50cy5hZGRMaXN0ZW5lcigoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlRXZlbnQoXCJFVkVOVCBGSVJFRDogXCIgKyBKU09OLnN0cmluZ2lmeShldmVudCkpO1xuXG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgZ2FtZUxhdW5jaGVkKGdhbWVJbmZvUmVzdWx0KSB7XG4gICAgICAgIGlmICghZ2FtZUluZm9SZXN1bHQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZ2FtZUluZm9SZXN1bHQuZ2FtZUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZ2FtZUluZm9SZXN1bHQucnVubmluZ0NoYW5nZWQgJiYgIWdhbWVJbmZvUmVzdWx0LmdhbWVDaGFuZ2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWdhbWVJbmZvUmVzdWx0LmdhbWVJbmZvLmlzUnVubmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTk9URTogd2UgZGl2aWRlIGJ5IDEwIHRvIGdldCB0aGUgZ2FtZSBjbGFzcyBpZCB3aXRob3V0IGl0J3Mgc2VxdWVuY2UgbnVtYmVyXG4gICAgICAgIGlmIChNYXRoLmZsb29yKGdhbWVJbmZvUmVzdWx0LmdhbWVJbmZvLmlkIC8gMTApICE9IDU0MjYpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIlRGVCBMYXVuY2hlZFwiKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBnYW1lUnVubmluZyhnYW1lSW5mbykge1xuXG4gICAgICAgIGlmICghZ2FtZUluZm8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZ2FtZUluZm8uaXNSdW5uaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOT1RFOiB3ZSBkaXZpZGUgYnkgMTAgdG8gZ2V0IHRoZSBnYW1lIGNsYXNzIGlkIHdpdGhvdXQgaXQncyBzZXF1ZW5jZSBudW1iZXJcbiAgICAgICAgaWYgKE1hdGguZmxvb3IoZ2FtZUluZm8uaWQgLyAxMCkgIT0gNTQyNikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5pbmZvKFwiVEZUIHJ1bm5pbmdcIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzZXRQb3NpdGlvbigpIHtcbiAgICAgICAgY29uc3QgZ2FtZVJlcyA9IGF3YWl0IHRoaXMuZ2V0R2FtZVJlc29sdXRpb24oKTtcblxuICAgICAgICBpZiAoZ2FtZVJlcyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhcHBSZXMgPSBhd2FpdCB0aGlzLmdldEFwcFJlc29sdXRpb24oKTtcblxuICAgICAgICBvdmVyd29sZi53aW5kb3dzLmNoYW5nZVNpemUoXCJvdmVybGF5XCIsIDM1MCwgMTcwKVxuICAgICAgICBvdmVyd29sZi53aW5kb3dzLmNoYW5nZVBvc2l0aW9uKFwib3ZlcmxheVwiLCBnYW1lUmVzLndpZHRoIC0gYXBwUmVzLndpZHRoLCBnYW1lUmVzLmhlaWdodCAtIGFwcFJlcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0R2FtZVJlc29sdXRpb24oKTogUHJvbWlzZTx7IHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgb3ZlcndvbGYuZ2FtZXMuZ2V0UnVubmluZ0dhbWVJbmZvKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5sb2dpY2FsV2lkdGgpe1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiByZXN1bHQubG9naWNhbFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiByZXN1bHQubG9naWNhbEhlaWdodFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFwcFJlc29sdXRpb24oKTogUHJvbWlzZTx7IHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyIH0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgb3ZlcndvbGYud2luZG93cy5nZXRDdXJyZW50V2luZG93KChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHJlc3VsdC53aW5kb3cud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogcmVzdWx0LndpbmRvdy5oZWlnaHRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFN1bW1vbmVyTmFtZSgpIDogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICAgICAgb3ZlcndvbGYuZ2FtZXMubGF1bmNoZXJzLmV2ZW50cy5nZXRJbmZvKDEwOTAyLCBpbmZvID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaW5mby5zdWNjZXNzKXtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpbmZvLnJlcy5zdW1tb25lcl9pbmZvLmRpc3BsYXlfbmFtZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBnZXQgc3VtbW9uZXIgbmFtZSwgdHJ5aW5nIGFnYWluIGluIDJzXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLmdldFN1bW1vbmVyTmFtZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IG92ZXJsYXkgPSBuZXcgT3ZlcmxheSgpO1xud2luZG93Lm92ZXJsYXkgPSBvdmVybGF5OyIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0ge307XG5fX3dlYnBhY2tfbW9kdWxlc19fW1wiLi9zcmMvb3ZlcmxheS9vdmVybGF5LnRzXCJdKDAsIF9fd2VicGFja19leHBvcnRzX18pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==