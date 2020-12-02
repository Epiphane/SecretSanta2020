var Sounds: { [key: string]: HTMLAudioElement } = {};

export function Play(name: string) {
    Sounds[name].play();
}

export function Pause(name: string) {
    Sounds[name].pause();
}

export class Sound {
    name: string;

    constructor(name: string, src: string | boolean, loop?: boolean) {
        if (typeof src !== 'string') {
            src = name;
            loop = !!src;
        }

        this.name = name;

        if (!Sounds[name]) {
            Sound.load(name, src, loop!);
        }
    }

    static load(name: string, src: string, loop?: boolean) {
        var sound = Sounds[name] = document.createElement('audio');
        sound.loop = !!loop;
        var source = document.createElement("source");
        source.src = src;
        sound.appendChild(source);
        sound.load();
    }

    static play(name?: string) {
        Play(name || this.name);
    }

    static pause(name?: string) {
        Pause(name || this.name);
    }
}
