package econfig

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"ee-go/eerror"
	"ee-go/eruntime"
	"ee-go/estatic"
	"ee-go/eutil"

	"github.com/spf13/viper"
)

var (
	Vip *viper.Viper
)

func Init() {
	var defaultCfg map[string]any
	var envCfg map[string]any
	defaultCfgName := "public/config/config.default.json"
	envCfgName := "public/config/config.prod.json"

	// dev
	if eruntime.IsDev() {
		// 优先读项目中的（构建后，项目中的是不存在的）
		defaultConfigPath := filepath.Join(eruntime.BaseDir, "go", "config", "config.default.json")
		devConfigPath := filepath.Join(eruntime.BaseDir, "go", "config", "config.local.json")
		if eutil.FileIsExist(defaultConfigPath) && eutil.FileIsExist(devConfigPath) {
			defaultCfg = ReadJson(defaultConfigPath)
			envCfg = ReadJson(devConfigPath)
		}
	}

	if len(defaultCfg) == 0 || len(envCfg) == 0 {
		// 读 嵌入的StaticFS
		if estatic.FileIsExist(defaultCfgName) && estatic.FileIsExist(envCfgName) {
			defaultCfg = estatic.ReadConfigJson(defaultCfgName)
			envCfg = estatic.ReadConfigJson(envCfgName)
		} else {
			// 读 外部的 （config 没有被嵌入）
			defaultConfigPath := filepath.Join(eruntime.BaseDir, defaultCfgName)
			devConfigPath := filepath.Join(eruntime.BaseDir, envCfgName)
			if eutil.FileIsExist(defaultConfigPath) && eutil.FileIsExist(devConfigPath) {
				defaultCfg = ReadJson(defaultConfigPath)
				envCfg = ReadJson(devConfigPath)
			}
		}
	}

	// 都没有，直接报错
	if len(defaultCfg) == 0 || len(envCfg) == 0 {
		eerror.ThrowWithCode("The config file does not exist !", eerror.ExitConfigFileNotExist)
	}

	// merge
	eutil.Mapserge(envCfg, defaultCfg, nil)

	Vip = viper.New()
	for key, value := range defaultCfg {
		Vip.Set(key, value)
	}

	//fmt.Println("defaultCfg: ", Vip.AllSettings())
}

func Get(key string) any {
	return Vip.Get(key)
}

func GetAll() map[string]any {
	return Vip.AllSettings()
}

func GetLogger() map[string]any {
	cfg := Vip.Get("logger")
	logCfg, ok := cfg.(map[string]any)
	if !ok {
		eerror.ThrowWithCode("Get logger config error !", eerror.ExitConfigLogErr)
	}
	return logCfg
}

func GetHttp() map[string]any {
	cfg := Vip.Get("http")
	httpCfg, ok := cfg.(map[string]any)
	if !ok {
		eerror.ThrowWithCode("Get http config error !", eerror.ExitConfigHttpErr)
	}

	return httpCfg
}

func GetStatic() map[string]any {
	cfg := Vip.Get("static")
	staticCfg, ok := cfg.(map[string]any)
	if !ok {
		eerror.ThrowWithCode("Get static config error !", eerror.ExitConfigStaticErr)
	}
	return staticCfg
}

// Read config json
func ReadJson(f string) map[string]any {
	if !eutil.FileIsExist(f) {
		msg := fmt.Sprintf("File: %s is not exist !", f)
		eerror.ThrowWithCode(msg, eerror.ExitConfigFileNotExist)
	}

	data, err := os.ReadFile(f)
	if nil != err {
		msg := fmt.Sprintf("Read file: %s failed: %s", f, err)
		eerror.ThrowWithCode(msg, eerror.ExitConfigFile)
	}

	var ret map[string]any
	err = json.Unmarshal(data, &ret)
	if nil != err {
		msg := fmt.Sprintf("unmarshal file: %s failed: %s", f, err)
		eerror.ThrowWithCode(msg, eerror.ExitConfigFile)
	}

	return ret
}
